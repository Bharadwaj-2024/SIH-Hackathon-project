const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Complaint = require('../models/Complaint');
const CommunityPost = require('../models/CommunityPost');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', auth, [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
  body('complaint').optional().isMongoId().withMessage('Invalid complaint ID'),
  body('communityPost').optional().isMongoId().withMessage('Invalid community post ID'),
  body('parentComment').optional().isMongoId().withMessage('Invalid parent comment ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, complaint, communityPost, parentComment } = req.body;

    // Validate that either complaint or communityPost is provided
    if (!complaint && !communityPost) {
      return res.status(400).json({ message: 'Either complaint or community post ID is required' });
    }

    // Validate that the target exists
    if (complaint) {
      const complaintExists = await Complaint.findById(complaint);
      if (!complaintExists) {
        return res.status(404).json({ message: 'Complaint not found' });
      }
    }

    if (communityPost) {
      const postExists = await CommunityPost.findById(communityPost);
      if (!postExists) {
        return res.status(404).json({ message: 'Community post not found' });
      }
    }

    // Validate parent comment if provided
    if (parentComment) {
      const parentExists = await Comment.findById(parentComment);
      if (!parentExists) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      complaint,
      communityPost,
      parentComment
    });

    await comment.save();

    // Add comment to parent (complaint, post, or comment)
    if (complaint) {
      await Complaint.findByIdAndUpdate(complaint, {
        $push: { comments: comment._id }
      });
    }

    if (communityPost) {
      await CommunityPost.findByIdAndUpdate(communityPost, {
        $push: { comments: comment._id }
      });
    }

    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id }
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name avatar');

    // Emit real-time update
    const io = req.app.get('io');
    if (complaint) {
      io.emit('new-complaint-comment', {
        complaintId: complaint,
        comment: populatedComment
      });
    }
    if (communityPost) {
      io.emit('new-post-comment', {
        postId: communityPost,
        comment: populatedComment
      });
    }

    res.status(201).json({
      message: 'Comment created successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/comments/:id
// @desc    Get comment by ID with replies
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'name avatar'
        },
        options: { sort: { createdAt: 1 } }
      });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json(comment);
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private
router.put('/:id', auth, [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    // Check if comment is not too old (e.g., allow editing within 24 hours)
    const hoursSinceCreation = (Date.now() - comment.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(403).json({ message: 'Comment is too old to edit' });
    }

    const oldContent = comment.content;
    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editHistory.push({
      content: oldContent
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name avatar');

    res.json({
      message: 'Comment updated successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete comment (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.content = '[This comment has been deleted]';

    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/comments/:id/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user._id;
    const hasLiked = comment.likes.some(like => like.user.toString() === userId.toString());

    if (hasLiked) {
      // Unlike
      comment.likes = comment.likes.filter(like => like.user.toString() !== userId.toString());
    } else {
      // Like
      comment.likes.push({ user: userId });
    }

    await comment.save();

    res.json({
      message: hasLiked ? 'Comment unliked' : 'Comment liked',
      likeCount: comment.likes.length,
      hasLiked: !hasLiked
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/comments/complaint/:complaintId
// @desc    Get comments for a specific complaint
// @access  Public
router.get('/complaint/:complaintId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.find({
      complaint: req.params.complaintId,
      parentComment: { $exists: false }, // Only top-level comments
      isDeleted: false
    })
    .populate('author', 'name avatar')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'name avatar'
      },
      match: { isDeleted: false },
      options: { sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

    // Add like counts
    const commentsWithCounts = comments.map(comment => ({
      ...comment,
      likeCount: comment.likes?.length || 0,
      replyCount: comment.replies?.length || 0
    }));

    const total = await Comment.countDocuments({
      complaint: req.params.complaintId,
      parentComment: { $exists: false },
      isDeleted: false
    });

    res.json({
      comments: commentsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get complaint comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/comments/post/:postId
// @desc    Get comments for a specific community post
// @access  Public
router.get('/post/:postId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.find({
      communityPost: req.params.postId,
      parentComment: { $exists: false }, // Only top-level comments
      isDeleted: false
    })
    .populate('author', 'name avatar')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'name avatar'
      },
      match: { isDeleted: false },
      options: { sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

    // Add like counts
    const commentsWithCounts = comments.map(comment => ({
      ...comment,
      likeCount: comment.likes?.length || 0,
      replyCount: comment.replies?.length || 0
    }));

    const total = await Comment.countDocuments({
      communityPost: req.params.postId,
      parentComment: { $exists: false },
      isDeleted: false
    });

    res.json({
      comments: commentsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;