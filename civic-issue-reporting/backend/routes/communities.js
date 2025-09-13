const express = require('express');
const { body, validationResult } = require('express-validator');
const Community = require('../models/Community');
const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/communities
// @desc    Get all communities with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'memberCount',
      order = 'desc'
    } = req.query;

    const filter = { isActive: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortField = {};
    if (sortBy === 'memberCount') {
      // We'll sort by the length of members array
      sortField = { 'members': order === 'desc' ? -1 : 1 };
    } else {
      sortField = { [sortBy]: order === 'desc' ? -1 : 1 };
    }

    const communities = await Community.find(filter)
      .populate('createdBy', 'name avatar')
      .populate('moderators', 'name avatar')
      .sort(sortField)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add member count
    const communitiesWithCounts = communities.map(community => ({
      ...community,
      memberCount: community.members?.length || 0,
      postCount: community.posts?.length || 0
    }));

    const total = await Community.countDocuments(filter);

    res.json({
      communities: communitiesWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:id
// @desc    Get single community by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('createdBy', 'name avatar email')
      .populate('moderators', 'name avatar')
      .populate({
        path: 'members.user',
        select: 'name avatar'
      })
      .populate({
        path: 'posts',
        populate: {
          path: 'author',
          select: 'name avatar'
        },
        options: { sort: { isPinned: -1, createdAt: -1 }, limit: 10 }
      });

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    res.json(community);
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities
// @desc    Create a new community
// @access  Private
router.post('/', auth, upload.single('avatar'), handleMulterError, [
  body('name').trim().isLength({ min: 3, max: 50 }).withMessage('Name must be between 3 and 50 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('category').isIn(['Sanitation', 'Roads', 'Water', 'Electricity', 'Parks', 'Transport', 'Health', 'General', 'Other']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, category, isPrivate, requireApproval } = req.body;

    // Check if community name already exists
    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({ message: 'Community name already exists' });
    }

    const community = new Community({
      name,
      description,
      category,
      createdBy: req.user._id,
      settings: {
        isPrivate: isPrivate === 'true',
        requireApproval: requireApproval === 'true'
      }
    });

    // Add avatar if uploaded
    if (req.file) {
      community.avatar = `/uploads/${req.file.filename}`;
    }

    // Add creator as first member and moderator
    community.members.push({
      user: req.user._id,
      role: 'admin'
    });
    community.moderators.push(req.user._id);

    await community.save();

    // Update user's communities
    await User.findByIdAndUpdate(req.user._id, {
      $push: { communities: community._id }
    });

    const populatedCommunity = await Community.findById(community._id)
      .populate('createdBy', 'name avatar');

    res.status(201).json({
      message: 'Community created successfully',
      community: populatedCommunity
    });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:id/join
// @desc    Join a community
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (community.isMember(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this community' });
    }

    community.addMember(req.user._id);
    await community.save();

    // Update user's communities
    await User.findByIdAndUpdate(req.user._id, {
      $push: { communities: community._id }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(community._id.toString()).emit('member-joined', {
      user: {
        id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar
      },
      community: community._id
    });

    res.json({
      message: 'Successfully joined the community',
      memberCount: community.members.length
    });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:id/leave
// @desc    Leave a community
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (!community.isMember(req.user._id)) {
      return res.status(400).json({ message: 'Not a member of this community' });
    }

    if (community.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Community creator cannot leave the community' });
    }

    community.removeMember(req.user._id);
    await community.save();

    // Update user's communities
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { communities: community._id }
    });

    res.json({
      message: 'Successfully left the community',
      memberCount: community.members.length
    });
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:id/posts
// @desc    Get community posts
// @access  Public
router.get('/:id/posts', async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    const filter = { community: req.params.id };
    if (type && type !== 'all') {
      filter.type = type;
    }

    const posts = await CommunityPost.find(filter)
      .populate('author', 'name avatar')
      .populate('relatedComplaint', 'title status')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        },
        options: { limit: 3, sort: { createdAt: -1 } }
      })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add engagement counts
    const postsWithCounts = posts.map(post => ({
      ...post,
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0,
      viewCount: post.views?.length || 0
    }));

    const total = await CommunityPost.countDocuments(filter);

    res.json({
      posts: postsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get community posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:id/posts
// @desc    Create a new post in community
// @access  Private
router.post('/:id/posts', auth, upload.single('image'), handleMulterError, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('content').trim().isLength({ min: 10, max: 2000 }).withMessage('Content must be between 10 and 2000 characters'),
  body('type').optional().isIn(['discussion', 'announcement', 'question', 'update']).withMessage('Invalid post type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if user is a member
    if (!community.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Must be a community member to post' });
    }

    const { title, content, type = 'discussion', relatedComplaint } = req.body;

    const post = new CommunityPost({
      title,
      content,
      type,
      author: req.user._id,
      community: community._id,
      relatedComplaint: relatedComplaint || null
    });

    // Add image if uploaded
    if (req.file) {
      post.images.push({
        url: `/uploads/${req.file.filename}`,
        caption: req.body.imageCaption || ''
      });
    }

    await post.save();

    // Add post to community
    community.posts.push(post._id);
    await community.save();

    const populatedPost = await CommunityPost.findById(post._id)
      .populate('author', 'name avatar')
      .populate('relatedComplaint', 'title status');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(community._id.toString()).emit('new-post', populatedPost);

    res.status(201).json({
      message: 'Post created successfully',
      post: populatedPost
    });
  } catch (error) {
    console.error('Create community post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/user/my-communities
// @desc    Get current user's communities
// @access  Private
router.get('/user/my-communities', auth, async (req, res) => {
  try {
    const communities = await Community.find({
      'members.user': req.user._id,
      isActive: true
    })
    .populate('createdBy', 'name avatar')
    .sort({ 'members.joinedAt': -1 })
    .lean();

    const communitiesWithCounts = communities.map(community => ({
      ...community,
      memberCount: community.members?.length || 0,
      postCount: community.posts?.length || 0
    }));

    res.json({ communities: communitiesWithCounts });
  } catch (error) {
    console.error('Get user communities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;