const express = require('express');
const { body, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { auth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/complaints
// @desc    Get all complaints with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      sortBy = 'createdAt',
      order = 'desc',
      search,
      lat,
      lng,
      radius = 10
    } = req.query;

    const filter = {};
    
    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Search in title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Geospatial filter
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    const complaints = await Complaint.find(filter)
      .populate('submittedBy', 'name avatar')
      .populate('assignedTo', 'name avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      })
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add vote counts
    const complaintsWithCounts = complaints.map(complaint => ({
      ...complaint,
      upvoteCount: complaint.upvotes?.length || 0,
      downvoteCount: complaint.downvotes?.length || 0,
      commentCount: complaint.comments?.length || 0
    }));

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints: complaintsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get single complaint by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('submittedBy', 'name avatar email')
      .populate('assignedTo', 'name avatar email')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        },
        options: { sort: { createdAt: -1 } }
      })
      .populate('community', 'name slug');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private
router.post('/', auth, upload.single('image'), handleMulterError, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').custom((value) => {
    const allowed = ['Sanitation', 'Roads', 'Water', 'Electricity', 'Parks', 'Transport', 'Health', 'Other'];
    if (!value) throw new Error('Category is required');
    const normalized = String(value).toLowerCase();
    const ok = allowed.some(a => a.toLowerCase() === normalized);
    if (!ok) throw new Error('Invalid category');
    return true;
  }),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('address').trim().isLength({ min: 5 }).withMessage('Address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

  const { title, description, category, latitude, longitude, address, isAnonymous, priority } = req.body;

  // Normalize category capitalization
  const allowed = ['Sanitation', 'Roads', 'Water', 'Electricity', 'Parks', 'Transport', 'Health', 'Other'];
  const normalizedCategory = allowed.find(a => a.toLowerCase() === String(category).toLowerCase()) || 'Other';

    const complaint = new Complaint({
      title,
      description,
      category: normalizedCategory,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address
      },
      submittedBy: req.user._id,
      isAnonymous: isAnonymous === 'true'
    });

    if (priority && ['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
      complaint.priority = priority;
    }

    // Add image if uploaded
    if (req.file) {
      complaint.images.push({
        url: `/uploads/${req.file.filename}`,
        caption: req.body.imageCaption || ''
      });
    }

    await complaint.save();

    // Update user's complaint count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { complaintsSubmitted: 1 }
    });

    // Populate the complaint for response
    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('submittedBy', 'name avatar');

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('new-complaint', populatedComplaint);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: populatedComplaint
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status (admin only)
// @access  Private (Admin)
router.put('/:id/status', auth, [
  body('status').isIn(['Submitted', 'In Progress', 'Resolved', 'Rejected']).withMessage('Invalid status'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if user is admin or assigned to this complaint
    if (req.user.role !== 'admin' && complaint.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this complaint' });
    }

    const oldStatus = complaint.status;
    complaint.status = status;

    // Add to status history
    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      comment
    });

    // If resolved, add resolution details
    if (status === 'Resolved') {
      complaint.resolutionDetails = {
        description: comment,
        resolvedBy: req.user._id,
        resolvedAt: new Date()
      };
    }

    await complaint.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('complaint-status-update', {
      complaintId: complaint._id,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.name
    });

    res.json({
      message: 'Complaint status updated successfully',
      complaint
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/complaints/:id/vote
// @desc    Vote on a complaint (upvote/downvote)
// @access  Private
router.post('/:id/vote', auth, [
  body('voteType').isIn(['upvote', 'downvote']).withMessage('Invalid vote type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { voteType } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const userId = req.user._id;
    const hasUpvoted = complaint.upvotes.some(vote => vote.user.toString() === userId.toString());
    const hasDownvoted = complaint.downvotes.some(vote => vote.user.toString() === userId.toString());

    // Remove existing votes
    complaint.upvotes = complaint.upvotes.filter(vote => vote.user.toString() !== userId.toString());
    complaint.downvotes = complaint.downvotes.filter(vote => vote.user.toString() !== userId.toString());

    // Add new vote if different from existing
    if (voteType === 'upvote' && !hasUpvoted) {
      complaint.upvotes.push({ user: userId });
    } else if (voteType === 'downvote' && !hasDownvoted) {
      complaint.downvotes.push({ user: userId });
    }

    await complaint.save();

    res.json({
      message: 'Vote recorded successfully',
      upvoteCount: complaint.upvotes.length,
      downvoteCount: complaint.downvotes.length,
      userVote: complaint.hasUserVoted(userId)
    });
  } catch (error) {
    console.error('Vote complaint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/complaints/user/my-complaints
// @desc    Get current user's complaints
// @access  Private
router.get('/user/my-complaints', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { submittedBy: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const complaints = await Complaint.find(filter)
      .populate('assignedTo', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user complaints error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;