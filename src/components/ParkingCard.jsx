import React, { useState } from 'react'
import { MapPin, Clock, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

const ParkingCard = ({ parking }) => {
  const { id, name, location, price, status, image, rating } = parking;
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="parking-card card fade-in">
      <div className="card-image-container">
        <img src={image} alt={name} className="card-image" />
        <div className={`status-badge ${status === 'Available' ? 'status-available' : 'status-full'}`}>
          {status}
        </div>
        <button 
          className="favorite-btn glass" 
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
        >
          <Star size={18} fill={isFavorite ? "#FFD700" : "rgba(255, 255, 255, 0.5)"} color={isFavorite ? "#FFD700" : "white"} />
        </button>
      </div>
      
      <div className="card-content">
        <div className="card-header">
          <h3 className="parking-name">{name}</h3>
          <div className="rating">
            <Star size={14} fill="#FFD700" color="#FFD700" />
            <span>{rating}</span>
          </div>
        </div>
        
        <div className="card-details">
          <div className="detail-item">
            <MapPin size={14} color="var(--text-muted)" />
            <span>{location}</span>
          </div>
          <div className="detail-item">
            <Clock size={14} color="var(--text-muted)" />
            <span>24/7 Available</span>
          </div>
        </div>
        
        <div className="card-footer">
          <div className="price-tag">
            <span className="price-amount">₹{price}</span>
            <span className="price-unit">/hr</span>
          </div>
          <Link to={`/parking/${id}`} className="book-btn">
            Book Now
          </Link>
        </div>
      </div>

      <style jsx="true">{`
        .parking-card {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .card-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .parking-card:hover .card-image {
          transform: scale(1.1);
        }
        
        .status-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }
        
        .status-available {
          background: rgba(46, 204, 113, 0.9);
          color: white;
        }
        
        .status-full {
          background: rgba(231, 76, 60, 0.9);
          color: white;
        }
        
        .favorite-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
        }
        
        .card-content {
          padding: 1.25rem;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        
        .parking-name {
          font-size: 1.1rem;
          color: var(--text-dark);
        }
        
        .rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .card-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        
        .price-amount {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary-green);
        }
        
        .price-unit {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        
        .book-btn {
          background: var(--primary-green);
          color: white;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: var(--transition-smooth);
        }
        
        .book-btn:hover {
          background: var(--secondary-green);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(10, 66, 38, 0.2);
        }
      `}</style>
    </div>
  )
}

export default ParkingCard
