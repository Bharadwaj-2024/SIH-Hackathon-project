const mongoose = require('mongoose');
const slugify = require('slugify');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true,
    maxlength: [50, 'Community name cannot be more than 50 characters'],
    unique: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    enum: [
      'Sanitation',
      'Roads',
      'Water',
      'Electricity',
      'Parks',
      'Transport',
      'Health',
      'General',
      'Other'
    ],
    default: 'General'
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/200x200/009688/ffffff?text=Community'
  },
  coverImage: {
    type: String,
    default: 'https://via.placeholder.com/800x200/009688/ffffff?text=Community+Cover'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    }
  }],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost'
  }],
  complaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String,
    city: String,
    state: String
  },
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowPosts: {
      type: Boolean,
      default: true
    },
    allowComplaintSharing: {
      type: Boolean,
      default: true
    }
  },
  rules: [String],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for geospatial queries
communitySchema.index({ location: '2dsphere' });

// Index for search and filtering
communitySchema.index({ category: 1, isActive: 1 });
communitySchema.index({ name: 'text', description: 'text' });

// Virtual for member count
communitySchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for post count
communitySchema.virtual('postCount').get(function() {
  return this.posts.length;
});

// Pre-save middleware to generate slug
communitySchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Method to check if user is member
communitySchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if user is moderator
communitySchema.methods.isModerator = function(userId) {
  return this.moderators.some(mod => mod.toString() === userId.toString()) ||
         this.createdBy.toString() === userId.toString();
};

// Method to add member
communitySchema.methods.addMember = function(userId) {
  if (!this.isMember(userId)) {
    this.members.push({ user: userId });
  }
};

// Method to remove member
communitySchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
};

module.exports = mongoose.model('Community', communitySchema);