const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection (supports in-memory DB for dev/demo)
let mongoMemoryServer = null;

async function connectToDatabase() {
  try {
    let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civic-issues';

    if (process.env.USE_MEMORY_DB === 'true') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      mongoUri = mongoMemoryServer.getUri();
      console.log('🧪 Using in-memory MongoDB instance');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/comments', require('./routes/comments'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Civic Issues API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectToDatabase();

    // Optionally seed database on start (useful for in-memory DB/demo)
    if (process.env.SEED_ON_START === 'true') {
      try {
        const { seedAll } = require('./scripts/seedData');
        await seedAll();
        console.log('🌱 Seeded database data on server start');
      } catch (seedErr) {
        console.error('Seeding on start failed:', seedErr);
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Socket.io setup for real-time updates
    const io = require('socket.io')(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://your-domain.com'] 
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('👤 User connected:', socket.id);
      
      socket.on('join-community', (communityId) => {
        socket.join(communityId);
        console.log(`User ${socket.id} joined community ${communityId}`);
      });
      
      socket.on('leave-community', (communityId) => {
        socket.leave(communityId);
        console.log(`User ${socket.id} left community ${communityId}`);
      });
      
      socket.on('disconnect', () => {
        console.log('👋 User disconnected:', socket.id);
      });
    });

    // Make io available to routes
    app.set('io', io);

    // Graceful shutdown for in-memory Mongo
    process.on('SIGINT', async () => {
      if (mongoMemoryServer) {
        await mongoose.disconnect();
        await mongoMemoryServer.stop();
      }
      process.exit(0);
    });
  } catch (err) {
    console.error('Server start failed:', err.message);
    process.exit(1);
  }
}

startServer();
module.exports = app;