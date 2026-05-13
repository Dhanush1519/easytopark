import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Shield, Star, ChevronLeft, Calendar as CalendarIcon, Info, CheckCircle2, Loader2, Car, Layers, X, CreditCard, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const ParkingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState(null);
  
  // Booking Form State
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState(2); // hours
  const [selectedVehicleType, setSelectedVehicleType] = useState('Car');

  useEffect(() => {
    fetchParkingDetails();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setBookingDate(today);
    
    // Set default time to next hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    setBookingTime(now.toTimeString().slice(0, 5));
  }, [id]);

  const fetchParkingDetails = async () => {
    setLoading(true);
    try {
      if (!id) throw new Error("No ID provided");

      const { data, error } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Parking spot not found");
      
      setParking(data);
    } catch (err) {
      console.error('Error fetching parking details:', err);
      setError('Could not find parking spot.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const basePrice = (parking?.price_per_hour || parking?.price || 50);
    const totalAmount = basePrice * duration;
    const fee = totalAmount * 0.1; // 10% platform fee
    return {
      total: totalAmount,
      fee,
      grandTotal: totalAmount + fee
    };
  };

  const handleProceedToPayment = () => {
    if (!vehicleDetails) {
      alert('Please enter your vehicle details.');
      return;
    }
    setShowBookingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    setIsProcessingPayment(true);
    
    // Simulate payment delay
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Calculate exact start and end times
      const startDateTime = new Date(`${bookingDate}T${bookingTime}`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

      const pricing = calculateTotal();

      const { error } = await supabase
        .from('bookings')
        .insert([{
          user_id: user.id,
          spot_id: id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          amount: pricing.total,
          status: 'Pending',
          vehicle_details: vehicleDetails
        }]);

      if (error) throw error;
      
      setShowPaymentModal(false);
      setBooked(true);
    } catch (err) {
      console.error('Error creating booking:', err);
      alert("Payment failed or booking error: " + err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="details-page fade-in">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={24} /> Back
      </button>

      <div className="details-grid">
        {loading ? (
          <div className="loading-state full-width">
            <Loader2 size={40} className="spin" />
            <p>Fetching parking details...</p>
          </div>
        ) : error ? (
          <div className="error-state full-width">
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
          </div>
        ) : (
          <>
            <section className="image-preview-section">
              <div className="large-image-card card">
                <img 
                  src={parking?.images?.[0] || parking?.image_url || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=1200'} 
                  alt={parking?.name || 'Parking Spot'} 
                  className="main-image" 
                />
                <div className="image-overlay">
                  <span className={`status-badge status-${parking?.status?.toLowerCase() || 'available'}`}>
                    {parking?.status || 'Available'}
                  </span>
                </div>
              </div>
              
              <div className="amenities-grid">
                <div className="amenity-tag card glass">
                  <Car size={16} color="var(--primary-green)" />
                  <span>{parking?.vehicle_type || 'Car'} Parking</span>
                </div>
                <div className="amenity-tag card glass">
                  <Layers size={16} color="var(--primary-green)" />
                  <span>{parking?.is_covered ? 'Covered' : 'Open'} Space</span>
                </div>
                <div className="amenity-tag card glass">
                  <Shield size={16} color="var(--primary-green)" />
                  <span>Security Verified</span>
                </div>
              </div>
            </section>

            <section className="info-booking-section">
              <div className="info-card card">
                <div className="info-header">
                  <h1 className="parking-title">{parking?.name || 'Loading...'}</h1>
                  <div className="rating-badge">
                    <Star size={16} fill="#FFD700" color="#FFD700" />
                    <span>{parking?.rating || '4.8'} (Verified Listing)</span>
                  </div>
                </div>

                <div className="location-info">
                  <MapPin size={20} color="var(--primary-green)" />
                  <p>{parking?.address || parking?.location || 'Location Not Specified'}</p>
                </div>

                <div className="details-summary">
                  <div className="summary-item">
                    <Clock size={20} />
                    <div>
                      <span className="label">24/7 Access</span>
                      <span className="value">Available</span>
                    </div>
                  </div>
                  <div className="summary-item">
                    <Layers size={20} />
                    <div>
                      <span className="label">Type</span>
                      <span className="value">{parking?.is_covered ? 'Covered Basement' : 'Open Surface'}</span>
                    </div>
                  </div>
                </div>

                <div className="entry-box card glass">
                  <h4><Info size={16} /> Entry Instructions</h4>
                  <p>{parking?.entry_instructions || 'Please follow signboards to the designated slot. The owner will be notified upon your booking.'}</p>
                </div>

                <div className="pricing-box">
                  <div className="price-info">
                    <span className="price-val">₹{parking?.price_per_hour || parking?.price || 50}</span>
                    <span className="price-unit">/hour</span>
                  </div>
                </div>

                {!booked ? (
                  <button className="btn-primary book-now-btn" onClick={() => setShowBookingModal(true)}>
                    Select Time & Book
                  </button>
                ) : (
                  <div className="booking-success-container fade-in">
                    <div className="success-header">
                      <CheckCircle2 size={32} color="var(--primary-green)" />
                      <div>
                        <h3>Payment Confirmed!</h3>
                        <p>Your payment was successful. The owner will review your request shortly.</p>
                      </div>
                    </div>
                    <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                      View in My Bookings
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Booking Configuration Modal */}
      {showBookingModal && (
        <div className="modal-overlay fade-in">
          <div className="modal-content card">
            <div className="modal-header">
              <h2>Configure Booking</h2>
              <button className="close-btn" onClick={() => setShowBookingModal(false)}><X size={24}/></button>
            </div>
            
            <div className="modal-body">
              <div className="form-group-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Arrival Time</label>
                  <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Duration (Hours)</label>
                <div className="duration-selector">
                  {[1, 2, 4, 8, 24].map(h => (
                    <button 
                      key={h} 
                      className={`dur-btn ${duration === h ? 'active' : ''}`}
                      onClick={() => setDuration(h)}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>
                <div className="vehicle-selector">
                  {['Car', 'Bike', 'SUV'].map(v => (
                    <button 
                      key={v} 
                      className={`veh-btn ${selectedVehicleType === v ? 'active' : ''}`}
                      onClick={() => setSelectedVehicleType(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>Vehicle Model & Plate Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. Honda City - KA 01 AB 1234" 
                  value={vehicleDetails}
                  onChange={e => setVehicleDetails(e.target.value)}
                />
              </div>

              <div className="price-breakdown">
                <div className="pb-row">
                  <span>₹{parking?.price_per_hour || parking?.price || 50} x {duration} hours</span>
                  <span>₹{calculateTotal().total}</span>
                </div>
                <div className="pb-row">
                  <span>Platform Fee (10%)</span>
                  <span>₹{calculateTotal().fee}</span>
                </div>
                <div className="pb-divider"></div>
                <div className="pb-row pb-total">
                  <span>Total Amount</span>
                  <span>₹{calculateTotal().grandTotal}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-primary full-width" onClick={handleProceedToPayment}>
                Proceed to Payment (₹{calculateTotal().grandTotal})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Simulation Modal */}
      {showPaymentModal && (
        <div className="modal-overlay fade-in">
          <div className="payment-modal card">
            <div className="razorpay-header">
              <div className="brand">
                <ShieldCheck size={24} color="#0A4226"/>
                <span>Easy to Park Secure Pay</span>
              </div>
              <button className="close-btn white" onClick={() => setShowPaymentModal(false)}><X size={20}/></button>
            </div>
            
            <div className="payment-body">
              <div className="amount-display">
                <span className="currency">₹</span>
                <span className="amount">{calculateTotal().grandTotal}</span>
              </div>
              <p className="merchant-name">To: Easy to Park Escrow</p>

              <div className="mock-payment-options">
                <button 
                  className="btn-payment-success"
                  onClick={handlePaymentConfirm}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? <Loader2 size={18} className="spin"/> : "Payment Success"}
                </button>
                <button 
                  className="btn-payment-fail"
                  onClick={() => alert("Payment failed. Please try again.")}
                  disabled={isProcessingPayment}
                >
                  Payment Unsuccessful
                </button>
              </div>
            </div>

            <div className="payment-footer">
              <div className="secured-by">
                <Shield size={12} /> Secure Transaction Simulation
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .details-page { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem 8rem; }
        .back-btn { display: flex; align-items: center; gap: 0.5rem; background: none; color: var(--text-muted); font-weight: 600; margin-bottom: 2rem; }
        .details-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 3rem; }
        .large-image-card { position: relative; height: 450px; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 2rem; }
        .main-image { width: 100%; height: 100%; object-fit: cover; }
        .image-overlay { position: absolute; top: 1.5rem; left: 1.5rem; }
        .amenities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
        .amenity-tag { display: flex; align-items: center; gap: 0.75rem; padding: 12px; font-size: 0.9rem; font-weight: 500; }
        .info-card { padding: 2.5rem; position: sticky; top: 100px; }
        .parking-title { font-size: 2.25rem; margin-bottom: 0.5rem; }
        .rating-badge { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; }
        .location-info { display: flex; gap: 0.75rem; color: var(--text-dark); font-weight: 500; margin-bottom: 2rem; }
        .details-summary { display: flex; gap: 2rem; margin-bottom: 2rem; padding: 1.5rem 0; border-top: 1px solid var(--border-color); }
        .summary-item { display: flex; gap: 0.75rem; align-items: center; }
        .summary-item .label { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
        .summary-item .value { font-weight: 600; color: var(--text-dark); }
        .entry-box { padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid var(--primary-green); }
        .entry-box h4 { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.95rem; }
        .entry-box p { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }
        .pricing-box { background: rgba(10, 66, 38, 0.03); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 2rem; }
        .price-val { font-size: 2rem; font-weight: 800; color: var(--primary-green); }
        .price-unit { color: var(--text-muted); margin-left: 4px; }
        .book-now-btn { width: 100%; padding: 18px; font-size: 1.1rem; border-radius: 16px; margin-top: 1rem; }
        .booking-success-container { background: white; border: 2px solid var(--primary-green); padding: 1.5rem; border-radius: 16px; margin-bottom: 1rem; text-align: center; }
        .success-header { display: flex; align-items: center; gap: 1rem; text-align: left; margin-bottom: 1.5rem; }
        .btn-secondary { background: #F1F8F4; color: var(--primary-green); width: 100%; padding: 12px; border-radius: 12px; font-weight: 600; margin-top: 1rem; }
        .loading-state, .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem; color: var(--text-muted); gap: 1.5rem; text-align: center; }
        .spin { animation: spin 1s linear infinite; }
        .full-width { grid-column: 1 / -1; width: 100%; }
        .status-badge { padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; }
        .status-available { background: #2ECC71; color: white; }
        .status-confirmed { background: #3498DB; color: white; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .modal-content { width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 0; display: flex; flex-direction: column; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--border-color); }
        .modal-header h2 { margin: 0; font-size: 1.4rem; }
        .close-btn { background: none; color: var(--text-muted); padding: 4px; border-radius: 50%; transition: 0.2s; }
        .close-btn:hover { background: #F5F5F5; color: var(--text-dark); }
        .close-btn.white { color: white; }
        .close-btn.white:hover { background: rgba(255,255,255,0.2); color: white;}
        .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group-row { display: flex; gap: 1rem; }
        .form-group-row > * { flex: 1; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .form-group input { width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 10px; background: #F9F9F9; font-size: 1rem; outline: none; }
        .form-group input:focus { border-color: var(--primary-green); }
        .duration-selector, .vehicle-selector { display: flex; gap: 0.5rem; }
        .dur-btn, .veh-btn { flex: 1; padding: 10px; background: white; border: 1px solid var(--border-color); border-radius: 10px; font-weight: 600; color: var(--text-muted); transition: 0.2s; }
        .dur-btn.active, .veh-btn.active { background: var(--primary-green); color: white; border-color: var(--primary-green); }
        .price-breakdown { background: #F9F9F9; padding: 1.25rem; border-radius: 12px; margin-top: 1rem; }
        .pb-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; color: var(--text-muted); font-size: 0.95rem; }
        .pb-divider { height: 1px; background: var(--border-color); margin: 1rem 0; }
        .pb-total { color: var(--text-dark); font-weight: 800; font-size: 1.2rem; margin-bottom: 0; }
        .modal-footer { padding: 1.5rem; border-top: 1px solid var(--border-color); }
        .payment-modal { width: 100%; max-width: 400px; padding: 0; overflow: hidden; background: #F9F9F9; }
        .razorpay-header { background: #0D162B; color: white; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
        .brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 1.1rem; }
        .payment-body { padding: 2rem 1.5rem; }
        .amount-display { display: flex; align-items: flex-start; justify-content: center; gap: 2px; margin-bottom: 0.5rem; }
        .amount-display .currency { font-size: 1.2rem; font-weight: 600; margin-top: 4px; }
        .amount-display .amount { font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; }
        .merchant-name { text-align: center; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem; }
        .payment-methods { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
        .pm-option { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; }
        .pm-option.active { border-color: #3399CC; box-shadow: 0 0 0 2px rgba(51, 153, 204, 0.1); }
        .pm-option strong { display: block; font-size: 0.95rem; color: var(--text-dark); margin-bottom: 2px; }
        .pm-option p { margin: 0; font-size: 0.75rem; color: var(--text-muted); }
        .upi-icon { font-weight: 800; color: #FF7B00; font-style: italic; border: 1px solid #FF7B00; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; }
        .fake-card-form { background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.75rem; }
        .fake-card-form input { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: monospace; font-size: 0.95rem; }
        .payment-footer { padding: 1.5rem; background: white; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .mock-payment-options { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
        .btn-payment-success { background: var(--primary-green); color: white; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; transition: 0.3s; }
        .btn-payment-success:hover { background: #08331d; transform: scale(1.02); }
        .btn-payment-fail { background: #FDEDEC; color: #E74C3C; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; border: 1px solid rgba(231, 76, 60, 0.2); transition: 0.3s; }
        .btn-payment-fail:hover { background: #fadbd8; }
        .secured-by { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--text-muted); }
        @media (max-width: 992px) { .details-grid { grid-template-columns: 1fr; } .info-card { position: static; } .large-image-card { height: 350px; } .form-group-row { flex-direction: column; gap: 1rem; } }
      `}</style>
    </div>
  )
}

export default ParkingDetailsPage
