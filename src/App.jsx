import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ParkingDetailsPage from './pages/ParkingDetailsPage'
import AddParkingPage from './pages/AddParkingPage'
import UserDashboard from './pages/UserDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import LandingPage from './pages/LandingPage'

// Wrapper to conditionally show Navbar
const AppContent = () => {
  const location = useLocation();
  const showNavbar = !['/', '/login', '/signup', '/admin-dashboard', '/owner-dashboard', '/dashboard'].includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/parking/:id" element={<ParkingDetailsPage />} />
        <Route path="/add-parking" element={<AddParkingPage />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<div style={{padding: '2rem', textAlign: 'center'}}>Page Not Found</div>} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
