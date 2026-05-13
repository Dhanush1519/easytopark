import React, { useState, useEffect } from 'react'
import ParkingCard from '../components/ParkingCard'
import EmergencyButton from '../components/EmergencyButton'
import { Search, MapPin, SlidersHorizontal, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlighted, setHighlighted] = useState(false);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParkingSpots();
  }, []);

  const fetchParkingSpots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('status', 'Available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParkingSpots(data || []);
    } catch (err) {
      console.error('Error fetching parking spots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyClick = () => {
    setHighlighted(true);
    setTimeout(() => setHighlighted(false), 3000);
  };

  return (
    <div className="home-page">
      <header className="hero-section">
        <h1 className="hero-title">Find your perfect spot.</h1>
        <div className="search-container glass fade-in">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Find parking near me..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="location-btn">
              <MapPin size={18} />
            </button>
          </div>
          <button className="filter-btn">
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </header>

      <main className="listings-section">
        <div className="section-header">
          <h2 className="section-title">Parking Near You</h2>
          <span className="results-count">{parkingSpots.length} spots found</span>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 size={40} className="spin" />
            <p>Finding best spots for you...</p>
          </div>
        ) : (
          <div className="parking-grid">
            {parkingSpots.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(parking => (
              <div key={parking.id} className={highlighted && parking.status === 'Available' ? 'emergency-highlight' : ''}>
                <ParkingCard parking={parking} />
              </div>
            ))}
          </div>
        )}
      </main>

      <EmergencyButton onClick={handleEmergencyClick} />

      <style jsx="true">{`
        .home-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem 8rem;
        }
        
        .hero-section {
          text-align: center;
          padding: 4rem 0;
        }
        
        .hero-title {
          font-size: 3.5rem;
          color: var(--text-dark);
          margin-bottom: 2.5rem;
          letter-spacing: -1px;
        }
        
        .search-container {
          max-width: 700px;
          margin: 0 auto;
          display: flex;
          padding: 10px;
          border-radius: 24px;
          gap: 10px;
          box-shadow: var(--shadow-medium);
        }
        
        .search-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background: white;
          border-radius: 16px;
          padding: 0 1rem;
          border: 1px solid var(--border-color);
        }
        
        .search-icon {
          color: var(--text-muted);
        }
        
        .search-input-wrapper input {
          flex: 1;
          border: none;
          padding: 14px;
          font-size: 1rem;
          background: transparent;
        }
        
        .location-btn {
          background: none;
          color: var(--primary-green);
          padding: 8px;
        }
        
        .filter-btn {
          width: 54px;
          height: 54px;
          background: var(--primary-green);
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .listings-section {
          margin-top: 2rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .section-title {
          font-size: 1.75rem;
          color: var(--text-dark);
        }
        
        .results-count {
          color: var(--text-muted);
          font-weight: 500;
        }
        
        .parking-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: var(--text-muted);
          gap: 1rem;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .emergency-highlight {
          animation: pulseHighlight 1s ease infinite;
          border-radius: var(--radius-md);
        }

        @keyframes pulseHighlight {
          0% { box-shadow: 0 0 0 0px rgba(46, 204, 113, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(46, 204, 113, 0); }
          100% { box-shadow: 0 0 0 0px rgba(46, 204, 113, 0); }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }
          .hero-section {
            padding: 2rem 0;
          }
          .search-container {
            border-radius: 16px;
          }
          .parking-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default HomePage
