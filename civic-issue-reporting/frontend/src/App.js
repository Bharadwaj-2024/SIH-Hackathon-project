import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Complaints = React.lazy(() => import('./pages/Complaints'));
const ComplaintDetail = React.lazy(() => import('./pages/ComplaintDetail'));
const SubmitComplaint = React.lazy(() => import('./pages/SubmitComplaint'));
const Communities = React.lazy(() => import('./pages/Communities'));
const CommunityDetail = React.lazy(() => import('./pages/CommunityDetail'));
const Map = React.lazy(() => import('./pages/Map'));
const Profile = React.lazy(() => import('./pages/Profile'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <div className="App">
      <Navbar />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/complaints/:id" element={<ComplaintDetail />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/communities/:id" element={<CommunityDetail />} />
          <Route path="/map" element={<Map />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/submit-complaint" element={
            <ProtectedRoute>
              <SubmitComplaint />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#10b981',
              secondary: 'black',
            },
          },
          error: {
            duration: 5000,
            theme: {
              primary: '#ef4444',
              secondary: 'black',
            },
          },
        }}
      />
    </div>
  );
}

export default App;