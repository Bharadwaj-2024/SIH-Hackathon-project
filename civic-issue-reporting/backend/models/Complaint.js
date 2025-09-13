const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Sanitation',
      'Roads',
      'Water',
      'Electricity',
      'Parks',
      'Transport',
      'Health',
      'Other'
    ]
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Submitted'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 &&
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Invalid coordinates'
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    }
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  },
  tags: [String],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],
  resolutionDetails: {
    description: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionImages: [String]
  }
}, {
  timestamps: true
});

// Index for geospatial queries
complaintSchema.index({ location: '2dsphere' });

// Index for better query performance
complaintSchema.index({ status: 1, category: 1 });
complaintSchema.index({ submittedBy: 1, createdAt: -1 });
complaintSchema.index({ community: 1, createdAt: -1 });

// Virtual for vote count
complaintSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for engagement score
complaintSchema.virtual('engagementScore').get(function() {
  return this.upvotes.length + this.downvotes.length + this.comments.length;
});

// Pre-save middleware to add to status history
complaintSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  next();
});

// Method to check if user has voted
complaintSchema.methods.hasUserVoted = function(userId) {
  const hasUpvoted = this.upvotes.some(vote => vote.user.toString() === userId.toString());
  const hasDownvoted = this.downvotes.some(vote => vote.user.toString() === userId.toString());
  
  if (hasUpvoted) return 'upvote';
  if (hasDownvoted) return 'downvote';
  return null;
};

module.exports = mongoose.model('Complaint', complaintSchema);