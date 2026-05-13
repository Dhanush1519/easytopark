import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Bookmark, User, MapPin, Shield } from 'lucide-react'

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-icon">
            <MapPin size={24} color="var(--primary-green)" fill="var(--primary-green)" />
          </div>
          <span className="logo-text">Easy<span style={{color: 'var(--primary-green)'}}>Park</span></span>
        </Link>
        
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={20} />
            <span>Home</span>
          </Link>
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
            <Bookmark size={20} />
            <span>My Bookings</span>
          </Link>
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
            <User size={20} />
            <span>Profile</span>
          </Link>
          <Link to="/admin-dashboard" className="nav-link admin-link" title="Admin Panel">
            <Shield size={20} />
          </Link>
          <Link to="/add-parking" className="btn-primary" style={{padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem'}}>
            List Parking
          </Link>
        </div>
      </div>
      
      <style jsx="true">{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 70px;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          margin-bottom: 1rem;
        }
        
        .nav-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          color: var(--text-dark);
        }
        
        .logo-icon {
          background: rgba(10, 66, 38, 0.1);
          padding: 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .nav-links {
          display: flex;
          gap: 2rem;
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-weight: 500;
          font-size: 0.95rem;
          transition: var(--transition-smooth);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
        }
        
        .nav-link:hover {
          color: var(--primary-green);
          background: rgba(10, 66, 38, 0.05);
        }
        
        .nav-link.active {
          color: var(--primary-green);
          background: rgba(10, 66, 38, 0.1);
        }

        @media (max-width: 768px) {
          .nav-links span {
            display: none;
          }
          .nav-links {
            gap: 0.5rem;
          }
          .nav-link {
            padding: 10px;
          }
        }
      `}</style>
    </nav>
  )
}

export default Navbar
