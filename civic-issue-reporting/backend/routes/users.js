const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Community = require('../models/Community');
const { auth, adminAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email')
      .populate('communities', 'name slug avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's complaint statistics
    const complaintStats = await Complaint.aggregate([
      { $match: { submittedBy: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      submitted: 0,
      inProgress: 0,
      resolved: 0
    };

    complaintStats.forEach(stat => {
      stats.total += stat.count;
      if (stat._id === 'Submitted') stats.submitted = stat.count;
      if (stat._id === 'In Progress') stats.inProgress = stat.count;
      if (stat._id === 'Resolved') stats.resolved = stat.count;
    });

    res.json({
      user,
      complaintStats: stats
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, upload.single('avatar'), handleMulterError, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateFields = {};
    const { name, phone } = req.body;

    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;

    // Update avatar if uploaded
    if (req.file) {
      updateFields.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's recent complaints
    const recentComplaints = await Complaint.find({ submittedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedTo', 'name avatar');

    // Get user's communities
    const userCommunities = await Community.find({
      'members.user': userId,
      isActive: true
    })
    .limit(5)
    .lean();

    // Get complaint statistics
    const complaintStats = await Complaint.aggregate([
      { $match: { submittedBy: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      submitted: 0,
      inProgress: 0,
      resolved: 0
    };

    complaintStats.forEach(stat => {
      stats.total += stat.count;
      if (stat._id === 'Submitted') stats.submitted = stat.count;
      if (stat._id === 'In Progress') stats.inProgress = stat.count;
      if (stat._id === 'Resolved') stats.resolved = stat.count;
    });

    // Get nearby complaints (if user has location)
    let nearbyComplaints = [];
    if (req.user.location && req.user.location.coordinates[0] !== 0) {
      nearbyComplaints = await Complaint.find({
        location: {
          $near: {
            $geometry: req.user.location,
            $maxDistance: 5000 // 5km radius
          }
        },
        submittedBy: { $ne: userId }
      })
      .limit(5)
      .populate('submittedBy', 'name avatar');
    }

    res.json({
      recentComplaints,
      userCommunities,
      complaintStats: stats,
      nearbyComplaints
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/location
// @desc    Update user location
// @access  Private
router.put('/location', auth, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('address').optional().trim().isLength({ min: 5 }).withMessage('Address must be at least 5 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { latitude, longitude, address } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || ''
      }
    });

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ],
      isActive: true
    })
    .select('name avatar reputationScore complaintsSubmitted')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ reputationScore: -1 });

    const total = await User.countDocuments({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ],
      isActive: true
    });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get user leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const users = await User.find({ isActive: true })
      .select('name avatar reputationScore complaintsSubmitted')
      .sort({ reputationScore: -1, complaintsSubmitted: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({ isActive: true });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/admin/stats
// @desc    Get admin statistics
// @access  Private (Admin only)
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      isActive: true,
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    // Complaint statistics
    const totalComplaints = await Complaint.countDocuments();
    const complaintsByStatus = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const complaintsByCategory = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Community statistics
    const totalCommunities = await Community.countDocuments({ isActive: true });
    const communitiesByCategory = await Community.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activity
    const recentComplaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('submittedBy', 'name avatar')
      .select('title status category createdAt');

    res.json({
      userStats: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth
      },
      complaintStats: {
        total: totalComplaints,
        byStatus: complaintsByStatus,
        byCategory: complaintsByCategory
      },
      communityStats: {
        total: totalCommunities,
        byCategory: communitiesByCategory
      },
      recentActivity: recentComplaints
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private (Admin only)
router.put('/:id/role', adminAuth, [
  body('role').isIn(['user', 'admin', 'moderator']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;