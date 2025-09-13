const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [2000, 'Content cannot be more than 2000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  type: {
    type: String,
    enum: ['discussion', 'announcement', 'question', 'update'],
    default: 'discussion'
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  relatedComplaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  },
  tags: [String],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    title: String,
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
communityPostSchema.index({ community: 1, createdAt: -1 });
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ type: 1, isPinned: -1, createdAt: -1 });

// Text index for search
communityPostSchema.index({ title: 'text', content: 'text' });

// Virtual for like count
communityPostSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
communityPostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for view count
communityPostSchema.virtual('viewCount').get(function() {
  return this.views.length;
});

// Method to check if user has liked
communityPostSchema.methods.hasUserLiked = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to add view
communityPostSchema.methods.addView = function(userId) {
  const existingView = this.views.find(view => view.user.toString() === userId.toString());
  if (!existingView) {
    this.views.push({ user: userId });
  }
};

// Pre-save middleware to handle edit history
communityPostSchema.pre('save', function(next) {
  if ((this.isModified('title') || this.isModified('content')) && !this.isNew) {
    this.editHistory.push({
      title: this.title,
      content: this.content,
      editedAt: new Date()
    });
    this.isEdited = true;
  }
  next();
});

module.exports = mongoose.model('CommunityPost', communityPostSchema);