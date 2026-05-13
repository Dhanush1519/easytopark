import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, IndianRupee, Clock, Upload, Plus, Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const AddParkingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    timings: 'Open 24/7',
    available: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to list a parking spot.');
      }

      const { error } = await supabase
        .from('parking_spots')
        .insert([{
          owner_id: user.id,
          name: formData.name || formData.location,
          location: formData.location,
          price: parseFloat(formData.price),
          status: formData.available ? 'Available' : 'Pending',
          image_url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800" // Default image for now
        }]);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Error adding parking spot:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-parking-page fade-in">
      <div className="form-container">
        <header className="form-header">
          <h1 className="form-title">List Your Parking</h1>
          <p className="form-subtitle">Earn extra by sharing your unused parking space</p>
        </header>

        {error && (
          <div className="error-message fade-in">
            {error}
          </div>
        )}

        <form className="add-form card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label><MapPin size={18} /> Location Name / Address</label>
              <input 
                type="text" 
                placeholder="e.g. Skyline Residency, Block C" 
                required 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label><IndianRupee size={18} /> Price per hour</label>
              <input 
                type="number" 
                placeholder="e.g. 50" 
                required 
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label><Clock size={18} /> Available Timings</label>
              <select 
                value={formData.timings}
                onChange={(e) => setFormData({...formData, timings: e.target.value})}
              >
                <option>Open 24/7</option>
                <option>Weekdays only</option>
                <option>Weekends only</option>
                <option>Custom hours</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label><Upload size={18} /> Upload Image</label>
              <div className="upload-box">
                <Plus size={32} color="var(--text-muted)" />
                <span>Drag & drop or click to upload</span>
              </div>
            </div>

            <div className="form-group full-width toggle-group">
              <div className="toggle-info">
                <span className="toggle-label">Mark as Available</span>
                <span className="toggle-sub">Instantly show your spot to drivers</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={formData.available}
                  onChange={(e) => setFormData({...formData, available: e.target.checked})}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <button type="submit" className={`btn-primary submit-btn ${loading ? 'loading' : ''}`} disabled={loading || success}>
            {success ? (
              <><Check size={20} /> Listing Created!</>
            ) : loading ? (
              'Creating Listing...'
            ) : (
              'Add Parking Slot'
            )}
          </button>
        </form>
      </div>

      <style jsx="true">{`
        .add-parking-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 4rem 1.5rem 8rem;
        }
        
        .form-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        .form-title {
          font-size: 2.5rem;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }
        
        .form-subtitle {
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .error-message {
          background: rgba(231, 76, 60, 0.1);
          color: #E74C3C;
          padding: 12px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(231, 76, 60, 0.2);
          text-align: center;
        }
        
        .add-form {
          padding: 3rem;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .full-width {
          grid-column: span 2;
        }
        
        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--text-dark);
          font-size: 0.95rem;
        }
        
        .form-group input, .form-group select {
          padding: 14px 16px;
          border-radius: 12px;
          background: #F9F9F9;
          font-size: 1rem;
          border: 1px solid var(--border-color);
        }
        
        .form-group input:focus {
          border-color: var(--primary-green);
          background: white;
          box-shadow: 0 0 0 4px rgba(10, 66, 38, 0.1);
        }
        
        .upload-box {
          height: 150px;
          border: 2px dashed var(--border-color);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: var(--text-muted);
          transition: var(--transition-smooth);
          cursor: pointer;
        }
        
        .upload-box:hover {
          border-color: var(--primary-green);
          background: rgba(10, 66, 38, 0.02);
        }
        
        .toggle-group {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          background: rgba(10, 66, 38, 0.04);
          padding: 1.5rem;
          border-radius: 16px;
        }
        
        .toggle-info {
          display: flex;
          flex-direction: column;
        }
        
        .toggle-label {
          font-weight: 700;
          color: var(--text-dark);
        }
        
        .toggle-sub {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        
        .submit-btn {
          width: 100%;
          padding: 18px;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        
        /* Switch styling */
        .switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        
        input:checked + .slider {
          background-color: var(--primary-green);
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        .slider.round {
          border-radius: 34px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }

        @media (max-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .full-width {
            grid-column: span 1;
          }
          .add-form {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default AddParkingPage
