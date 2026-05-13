import React, { useState } from 'react'
import { AlertCircle } from 'lucide-react'

const EmergencyButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      className="emergency-btn"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <AlertCircle size={24} />
      {isHovered && <span className="btn-text">Need Parking Now</span>}
      
      <style jsx="true">{`
        .emergency-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background-color: #E74C3C;
          color: white;
          width: ${isHovered ? 'auto' : '60px'};
          height: 60px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: ${isHovered ? '0 1.5rem' : '0'};
          box-shadow: 0 8px 25px rgba(231, 76, 60, 0.4);
          z-index: 999;
          transition: var(--transition-smooth);
          border: 2px solid white;
        }
        
        .emergency-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(231, 76, 60, 0.5);
        }
        
        .btn-text {
          font-weight: 600;
          white-space: nowrap;
          animation: slideIn 0.3s ease;
        }

        @media (max-width: 768px) {
          bottom: 1.5rem;
          right: 1.5rem;
          width: 50px;
          height: 50px;
        }
      `}</style>
    </button>
  )
}

export default EmergencyButton
