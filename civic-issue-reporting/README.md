# Crowdsourced Civic Issue Reporting and Resolution System

A full-stack web application for reporting and resolving civic issues with community engagement features.

## 🚀 Features

- **Authentication**: Secure user login/signup with JWT
- **Issue Reporting**: Submit complaints with photo upload and auto-location
- **Community Engagement**: Create/join communities for common issues
- **Interactive Map**: Visual complaint tracking with status-coded pins
- **Social Features**: Upvote/downvote complaints and comment system
- **Multi-language Support**: English, Hindi, and Kannada
- **Dark Mode**: Toggle between light and dark themes
- **Admin Dashboard**: Manage complaint statuses

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router for navigation
- TailwindCSS for styling
- i18next for internationalization
- Leaflet for interactive maps
- Axios for API calls

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- Multer for file uploads
- Socket.io for real-time updates

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/civic-issues
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Seed the database with fake data:
```bash
npm run seed
```

5. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm start
```

## 🌟 Usage

1. Open your browser and go to `http://localhost:3000`
2. Sign up for a new account or use test credentials
3. Submit complaints with photos and location
4. Join communities and engage with other users
5. View complaints on the interactive map
6. Toggle between languages and dark/light mode

## 🗺️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Complaints
- `GET /api/complaints` - Get all complaints
- `POST /api/complaints` - Create new complaint
- `PUT /api/complaints/:id` - Update complaint
- `POST /api/complaints/:id/upvote` - Upvote complaint
- `POST /api/complaints/:id/downvote` - Downvote complaint

### Communities
- `GET /api/communities` - Get all communities
- `POST /api/communities` - Create new community
- `POST /api/communities/:id/join` - Join community
- `GET /api/communities/:id/posts` - Get community posts

## 🎨 UI/UX Features

- Modern, social media-inspired design
- Card-based layout for complaints
- Responsive design (mobile-first)
- Dark mode toggle
- Smooth animations and transitions
- Intuitive navigation

## 🌍 Multi-language Support

The application supports:
- English (default)
- Hindi (हिंदी)
- Kannada (ಕನ್ನಡ)

Switch languages using the language selector in the navigation bar.

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@civicissues.com or create an issue in the repository.