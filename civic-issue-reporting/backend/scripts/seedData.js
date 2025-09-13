const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Community = require('../models/Community');
const CommunityPost = require('../models/CommunityPost');
const Comment = require('../models/Comment');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civic-issues', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fake data arrays
const departments = ['Sanitation', 'Roads', 'Water', 'Electricity', 'Parks', 'Transport', 'Health'];

const fakeUsers = [
  {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+919876543210',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Bangalore coordinates
      address: 'Koramangala, Bangalore'
    }
  },
  {
    name: 'Priya Patel',
    email: 'priya@example.com',
    phone: '+919876543211',
    location: {
      type: 'Point',
      coordinates: [77.6081, 12.9348],
      address: 'Whitefield, Bangalore'
    }
  },
  {
    name: 'Arjun Kumar',
    email: 'arjun@example.com',
    phone: '+919876543212',
    location: {
      type: 'Point',
      coordinates: [77.5647, 12.9698],
      address: 'Jayanagar, Bangalore'
    }
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha@example.com',
    phone: '+919876543213',
    location: {
      type: 'Point',
      coordinates: [77.6033, 12.9279],
      address: 'Electronic City, Bangalore'
    }
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    phone: '+919876543214',
    location: {
      type: 'Point',
      coordinates: [77.5385, 12.9924],
      address: 'Malleshwaram, Bangalore'
    }
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+919876543215',
    role: 'admin',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716],
      address: 'MG Road, Bangalore'
    }
  }
];

const fakeComplaints = [
  {
    title: 'Broken Street Light on MG Road',
    description: 'The street light near Cafe Coffee Day has been broken for over a week. This creates safety concerns for pedestrians during night time.',
    category: 'Electricity',
    location: {
      type: 'Point',
      coordinates: [77.6174, 12.9759],
      address: 'MG Road, Bangalore'
    },
    priority: 'High'
  },
  {
    title: 'Pothole on Hosur Road',
    description: 'Large pothole near Electronic City metro station causing traffic jams and vehicle damage. Multiple vehicles have been damaged.',
    category: 'Roads',
    location: {
      type: 'Point',
      coordinates: [77.6033, 12.9279],
      address: 'Hosur Road, Electronic City'
    },
    priority: 'Critical'
  },
  {
    title: 'Garbage Not Collected for 3 Days',
    description: 'Garbage has not been collected in our area for the past 3 days. The smell is becoming unbearable and attracting flies.',
    category: 'Sanitation',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716],
      address: 'Koramangala 5th Block'
    },
    priority: 'High'
  },
  {
    title: 'Water Supply Disruption',
    description: 'No water supply for the past 2 days in our apartment complex. Over 200 families are affected.',
    category: 'Water',
    location: {
      type: 'Point',
      coordinates: [77.6081, 12.9348],
      address: 'Whitefield Main Road'
    },
    priority: 'Critical'
  },
  {
    title: 'Park Maintenance Required',
    description: 'The children\'s play equipment in the park is broken and needs immediate repair. Some swings are dangerous.',
    category: 'Parks',
    location: {
      type: 'Point',
      coordinates: [77.5647, 12.9698],
      address: 'Jayanagar 4th Block Park'
    },
    priority: 'Medium'
  },
  {
    title: 'Bus Stop Shelter Damaged',
    description: 'The bus stop shelter near the metro station is completely damaged and provides no protection from rain.',
    category: 'Transport',
    location: {
      type: 'Point',
      coordinates: [77.5385, 12.9924],
      address: 'Malleshwaram Bus Stop'
    },
    priority: 'Medium'
  },
  {
    title: 'Mosquito Infestation Near Hospital',
    description: 'Severe mosquito problem near the government hospital due to stagnant water. Risk of dengue outbreak.',
    category: 'Health',
    location: {
      type: 'Point',
      coordinates: [77.5731, 12.9442],
      address: 'Near Government Hospital, BTM Layout'
    },
    priority: 'High'
  },
  {
    title: 'Illegal Parking Blocking Road',
    description: 'Cars are illegally parked on the main road causing severe traffic congestion during peak hours.',
    category: 'Transport',
    location: {
      type: 'Point',
      coordinates: [77.6267, 12.9634],
      address: 'Commercial Street'
    },
    priority: 'Medium'
  },
  {
    title: 'Overflowing Sewage Drain',
    description: 'The sewage drain is overflowing and spilling onto the road. Urgent attention needed.',
    category: 'Sanitation',
    location: {
      type: 'Point',
      coordinates: [77.5516, 12.9173],
      address: 'JP Nagar 2nd Phase'
    },
    priority: 'Critical'
  },
  {
    title: 'Power Cut Issues',
    description: 'Frequent power cuts in our area for the past week. No prior notice given by electricity board.',
    category: 'Electricity',
    location: {
      type: 'Point',
      coordinates: [77.6409, 12.9298],
      address: 'HSR Layout Sector 1'
    },
    priority: 'High'
  },
  {
    title: 'Missing Road Signs',
    description: 'Important traffic signs are missing at this junction causing confusion for drivers.',
    category: 'Roads',
    location: {
      type: 'Point',
      coordinates: [77.5804, 12.9351],
      address: 'Richmond Road Junction'
    },
    priority: 'Medium'
  },
  {
    title: 'Broken Water Pipeline',
    description: 'Main water pipeline is broken causing water wastage and road flooding.',
    category: 'Water',
    location: {
      type: 'Point',
      coordinates: [77.5990, 12.9866],
      address: 'Banaswadi Main Road'
    },
    priority: 'Critical'
  }
];

const fakeCommunities = [
  {
    name: 'Koramangala Residents',
    description: 'Community for residents of Koramangala to discuss local issues and organize neighborhood activities.',
    category: 'General',
    coverImage: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1280&auto=format&fit=crop',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716],
      address: 'Koramangala, Bangalore'
    }
  },
  {
    name: 'Bangalore Traffic Watchers',
    description: 'Community focused on reporting and discussing traffic-related issues across Bangalore.',
    category: 'Transport',
    coverImage: 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?q=80&w=1280&auto=format&fit=crop',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716],
      address: 'Bangalore, Karnataka'
    }
  },
  {
    name: 'Clean Bangalore Initiative',
    description: 'Citizens working together to keep Bangalore clean and green. Report sanitation issues and organize cleanup drives.',
    category: 'Sanitation',
    coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1280&auto=format&fit=crop',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716],
      address: 'Bangalore, Karnataka'
    }
  },
  {
    name: 'Whitefield IT Corridor',
    description: 'Community for IT professionals and residents in Whitefield area to address local infrastructure issues.',
    category: 'General',
    coverImage: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1280&auto=format&fit=crop',
    location: {
      type: 'Point',
      coordinates: [77.6081, 12.9348],
      address: 'Whitefield, Bangalore'
    }
  }
];

const sampleComments = [
  'This is a serious issue that needs immediate attention!',
  'I have also noticed this problem in my area.',
  'Thank you for reporting this. I will escalate to concerned authorities.',
  'Same issue here! When will this be fixed?',
  'Great initiative! How can we help?',
  'This has been going on for too long. Action needed.',
  'I support this complaint. Very valid concern.',
  'Has anyone contacted the local MLA about this?',
  'We should organize and approach the authorities together.',
  'This affects so many people in our community.',
  'Thanks for taking the time to report this issue.',
  'I will also file a complaint about this.'
];

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Community.deleteMany({});
    await CommunityPost.deleteMany({});
    await Comment.deleteMany({});
    console.log('🗑️  Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.insertMany(
      fakeUsers.map(user => ({
        ...user,
        password: hashedPassword,
        reputationScore: Math.floor(Math.random() * 100),
        complaintsSubmitted: Math.floor(Math.random() * 10)
      }))
    );
    
    console.log(`👥 Created ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error seeding users:', error);
    return [];
  }
};

// Seed communities
const seedCommunities = async (users) => {
  try {
    const communities = [];
    
    for (let i = 0; i < fakeCommunities.length; i++) {
      const communityData = fakeCommunities[i];
      const creator = users[i % users.length];
      
      const community = new Community({
        ...communityData,
        createdBy: creator._id,
        moderators: [creator._id],
        members: [{ user: creator._id, role: 'admin' }]
      });
      
      // Add random members
      const randomMembers = users
        .filter(u => u._id !== creator._id)
        .slice(0, Math.floor(Math.random() * 4) + 2);
      
      randomMembers.forEach(user => {
        community.members.push({ user: user._id });
      });
      
      await community.save();
      communities.push(community);
    }
    
    console.log(`🏘️  Created ${communities.length} communities`);
    return communities;
  } catch (error) {
    console.error('Error seeding communities:', error);
    return [];
  }
};

// Seed complaints
const seedComplaints = async (users, communities) => {
  try {
    const complaints = [];
    const statuses = ['Submitted', 'In Progress', 'Resolved'];
    
    for (let i = 0; i < fakeComplaints.length; i++) {
      const complaintData = fakeComplaints[i];
      const submitter = users[i % users.length];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const complaint = new Complaint({
        ...complaintData,
        submittedBy: submitter._id,
        status,
        community: Math.random() > 0.5 ? communities[Math.floor(Math.random() * communities.length)]._id : null
      });
      
      // Add random votes
      const voterUsers = users.slice(0, Math.floor(Math.random() * 5) + 1);
      voterUsers.forEach(user => {
        if (Math.random() > 0.5) {
          complaint.upvotes.push({ user: user._id });
        } else {
          complaint.downvotes.push({ user: user._id });
        }
      });
      
      await complaint.save();
      complaints.push(complaint);
    }
    
    console.log(`📝 Created ${complaints.length} complaints`);
    return complaints;
  } catch (error) {
    console.error('Error seeding complaints:', error);
    return [];
  }
};

// Seed community posts
const seedCommunityPosts = async (users, communities) => {
  try {
    const posts = [];
    const postTypes = ['discussion', 'announcement', 'question', 'update'];
    
    const samplePosts = [
      {
        title: 'Community Cleanup Drive This Weekend',
        content: 'Join us for a community cleanup drive this Saturday morning. We will be cleaning the park and surrounding areas. Bring gloves and bags!'
      },
      {
        title: 'New Traffic Signal Installation Update',
        content: 'Great news! The authorities have approved the installation of a new traffic signal at the main junction. Work will begin next month.'
      },
      {
        title: 'Anyone else facing water shortage?',
        content: 'Has anyone else been experiencing water shortage in our area? My building has had no water for 2 days now.'
      },
      {
        title: 'Monsoon Preparation Checklist',
        content: 'With monsoon approaching, here\'s a checklist to prepare our community: 1. Clear drainage systems 2. Check for potential flooding areas 3. Organize emergency contacts'
      }
    ];
    
    for (let i = 0; i < communities.length; i++) {
      const community = communities[i];
      const postsPerCommunity = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < postsPerCommunity; j++) {
        const postData = samplePosts[j % samplePosts.length];
        const author = users[Math.floor(Math.random() * users.length)];
        
        const post = new CommunityPost({
          title: postData.title,
          content: postData.content,
          type: postTypes[Math.floor(Math.random() * postTypes.length)],
          author: author._id,
          community: community._id
        });
        
        // Add random likes
        const likerUsers = users.slice(0, Math.floor(Math.random() * 4) + 1);
        likerUsers.forEach(user => {
          post.likes.push({ user: user._id });
        });
        
        await post.save();
        
        // Add post to community
        community.posts.push(post._id);
        posts.push(post);
      }
      
      await community.save();
    }
    
    console.log(`📄 Created ${posts.length} community posts`);
    return posts;
  } catch (error) {
    console.error('Error seeding community posts:', error);
    return [];
  }
};

// Seed comments
const seedComments = async (users, complaints, posts) => {
  try {
    const comments = [];
    
    // Comments on complaints
    for (const complaint of complaints) {
      const numComments = Math.floor(Math.random() * 4) + 1;
      
      for (let i = 0; i < numComments; i++) {
        const author = users[Math.floor(Math.random() * users.length)];
        const content = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        
        const comment = new Comment({
          content,
          author: author._id,
          complaint: complaint._id
        });
        
        // Add random likes
        const likerUsers = users.slice(0, Math.floor(Math.random() * 3));
        likerUsers.forEach(user => {
          comment.likes.push({ user: user._id });
        });
        
        await comment.save();
        
        // Add comment to complaint
        complaint.comments.push(comment._id);
        comments.push(comment);
      }
      
      await complaint.save();
    }
    
    // Comments on community posts
    for (const post of posts) {
      const numComments = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numComments; i++) {
        const author = users[Math.floor(Math.random() * users.length)];
        const content = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        
        const comment = new Comment({
          content,
          author: author._id,
          communityPost: post._id
        });
        
        await comment.save();
        
        // Add comment to post
        post.comments.push(comment._id);
        comments.push(comment);
      }
      
      await post.save();
    }
    
    console.log(`💬 Created ${comments.length} comments`);
    return comments;
  } catch (error) {
    console.error('Error seeding comments:', error);
    return [];
  }
};

// Main seeding function (standalone)
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    await clearDatabase();
    
    const users = await seedUsers();
    const communities = await seedCommunities(users);
    const complaints = await seedComplaints(users, communities);
    const posts = await seedCommunityPosts(users, communities);
    const comments = await seedComments(users, complaints, posts);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏘️  Communities: ${communities.length}`);
    console.log(`   📝 Complaints: ${complaints.length}`);
    console.log(`   📄 Community Posts: ${posts.length}`);
    console.log(`   💬 Comments: ${comments.length}`);
    
    console.log('\n🔑 Test credentials:');
    console.log('   Email: rahul@example.com');
    console.log('   Email: admin@example.com (Admin)');
    console.log('   Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Exportable seeding function (for programmatic use)
async function seedAll() {
  // If not connected, connect. When called from server start, a connection likely exists.
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  await clearDatabase();
  const users = await seedUsers();
  const communities = await seedCommunities(users);
  const complaints = await seedComplaints(users, communities);
  const posts = await seedCommunityPosts(users, communities);
  await seedComments(users, complaints, posts);
}

module.exports = { seedAll };

// Run seeding if executed directly
if (require.main === module) {
  seedDatabase();
}