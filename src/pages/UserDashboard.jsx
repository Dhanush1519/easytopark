import React, { useState, useEffect } from 'react';
import { 
  Home, MapPin, Bookmark, Heart, User, LogOut, Loader2, 
  Search, Bell, Map as MapIcon, ChevronRight, Clock, Star, Car,
  CheckCircle2, Image as ImageIcon, X, MessageSquare, Phone, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [parkingSpots, setParkingSpots] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const subscription = supabase
        .channel('public:user_dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
          fetchUserData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_spots' }, payload => {
          fetchUserData();
        })
        .subscribe();
        
      return () => supabase.removeChannel(subscription);
    };

    const unsubscribe = setupSubscription();
    return () => { unsubscribe.then(unsub => unsub && unsub()); };
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const [profileRes, bookingsRes, spotsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('bookings').select('*, parking_spots(*, owner:profiles!parking_spots_owner_id_fkey(phone, full_name))').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('parking_spots').select('*').in('status', ['Available', 'active', 'Active'])
      ]);

      setProfile(profileRes.data || { full_name: user.email.split('@')[0] });
      setBookings(bookingsRes.data || []);
      setParkingSpots(spotsRes.data || []);
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const activeBookings = bookings.filter(b => b.status === 'Active' || b.status === 'Confirmed' || b.status === 'Pending');
  const activeBooking = activeBookings.length > 0 ? activeBookings[0] : null;

  return (
    <div className="owner-dashboard user-dashboard fade-in">
      <div className="dashboard-container">
        <header className="dashboard-header glass">
          <div className="header-left">
            <div className="logo-container" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
              <div className="car-logo"><Car size={24} /></div>
              <span className="brand-name">Easy <span className="green-text">Park</span></span>
            </div>
          </div>
          
          <div className="header-center">
            <div className="search-widget">
              <Search size={18} />
              <input type="text" placeholder="Search for nearby parking..." onClick={() => setActiveTab('search')} />
            </div>
          </div>
          
          <div className="header-right">
            <button className="icon-btn-minimal"><Bell size={20} /></button>
            <div className="header-profile" onClick={() => setActiveTab('profile')}>
              <div className="profile-text">
                <span className="name">{profile?.full_name || 'User'}</span>
                <span className="role">Driver</span>
              </div>
              <div className="avatar" style={{background: '#3498DB'}}>
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-main">
          <aside className="dashboard-sidebar-floating card">
            <nav className="dashboard-nav">
              <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <Home size={20} /> <span className="nav-label">Dashboard Home</span>
              </button>
              <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
                <MapIcon size={20} /> <span className="nav-label">Find Parking</span>
              </button>
              <button className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                <Bookmark size={20} /> <span className="nav-label">My Bookings</span>
              </button>
              <button className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
                <Heart size={20} /> <span className="nav-label">Saved Spots</span>
              </button>
              <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                <User size={20} /> <span className="nav-label">Account Settings</span>
              </button>
            </nav>
            
            <button className="logout-btn-minimal" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </aside>

          <main className="dashboard-content-area">
            {loading ? (
              <div className="loading-state">
                <Loader2 size={40} className="spin" />
                <p>Loading your personalized dashboard...</p>
              </div>
            ) : (
              <div className="tab-container">
                {activeTab === 'overview' && <UserOverview activeBooking={activeBooking} bookings={bookings} parkingSpots={parkingSpots} setActiveTab={setActiveTab} navigate={navigate} />}
                {activeTab === 'search' && <UserSearch parkingSpots={parkingSpots} navigate={navigate} />}
                {activeTab === 'bookings' && <UserBookings bookings={bookings} navigate={navigate} />}
                {activeTab === 'saved' && <UserSaved />}
                {activeTab === 'profile' && <UserProfile profile={profile} refresh={fetchUserData} />}
              </div>
            )}
          </main>
        </div>
      </div>

      <style jsx="true">{`
        /* Core Layout Sync with OwnerDashboard */
        .owner-dashboard { min-height: 100vh; background: #F8FAFC; padding: 0; }
        .dashboard-header { height: 80px; display: flex; align-items: center; justify-content: space-between; padding: 0 2.5rem; position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.8); border-bottom: 1px solid rgba(0,0,0,0.05); }
        .logo-container { display: flex; align-items: center; gap: 12px; }
        .car-logo { width: 44px; height: 44px; background: var(--primary-green); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(10, 66, 38, 0.15); }
        .brand-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
        .green-text { color: var(--primary-green); }
        .search-widget { display: flex; align-items: center; gap: 12px; background: white; padding: 10px 20px; border-radius: 30px; width: 400px; border: 1px solid var(--border-color); transition: all 0.3s; }
        .search-widget:focus-within { border-color: var(--primary-green); box-shadow: 0 0 0 4px rgba(10, 66, 38, 0.05); }
        .search-widget input { border: none; background: none; width: 100%; outline: none; font-size: 0.95rem; }
        .header-profile { display: flex; align-items: center; gap: 15px; cursor: pointer; padding: 8px 12px; border-radius: 40px; transition: all 0.3s; }
        .header-profile:hover { background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .profile-text { text-align: right; }
        .profile-text .name { display: block; font-weight: 700; font-size: 0.95rem; color: var(--text-dark); }
        .profile-text .role { font-size: 0.75rem; color: var(--text-muted); }
        .icon-btn-minimal { background: none; border: none; color: var(--text-muted); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer; transition: 0.3s; }
        .icon-btn-minimal:hover { background: rgba(0,0,0,0.05); color: var(--text-dark); }
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; }
        
        .dashboard-main { display: grid; grid-template-columns: 80px 1fr; gap: 0; min-height: calc(100vh - 80px); }
        .dashboard-sidebar-floating { padding: 2rem 0.75rem; display: flex; flex-direction: column; align-items: center; border-right: 1px solid var(--border-color); background: white; margin: 0; border-radius: 0; }
        .dashboard-nav { display: flex; flex-direction: column; gap: 1.5rem; flex: 1; }
        .nav-item { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: none; position: relative; border: none; cursor: pointer; }
        .nav-label { position: absolute; left: 65px; background: var(--text-dark); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; opacity: 0; visibility: hidden; transition: 0.3s; white-space: nowrap; z-index: 10; }
        .nav-item:hover .nav-label { opacity: 1; visibility: visible; left: 60px; }
        .nav-item:hover { color: var(--primary-green); background: var(--bg-cream); }
        .nav-item.active { background: var(--primary-green); color: white; box-shadow: 0 8px 20px rgba(10, 66, 38, 0.2); }
        .dashboard-content-area { padding: 2.5rem; max-width: 1400px; margin: 0 auto; width: 100%; }
        .logout-btn-minimal { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #E74C3C; background: rgba(231, 76, 60, 0.05); transition: 0.3s; margin-top: auto; border: none; cursor: pointer; }
        .logout-btn-minimal:hover { background: #E74C3C; color: white; }
        
        @media (max-width: 992px) {
          .dashboard-header { padding: 0 1.5rem; }
          .search-widget { display: none; }
          .header-right { gap: 10px; }
          .profile-text { display: none; }
          .dashboard-main { grid-template-columns: 1fr; }
          .dashboard-sidebar-floating { position: fixed; bottom: 20px; left: 20px; right: 20px; height: 70px; flex-direction: row; padding: 0 1.5rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 1000; border: none; }
          .dashboard-nav { flex-direction: row; width: 100%; justify-content: space-around; }
          .nav-item .nav-label { display: none; }
          .logout-btn-minimal { display: none; }
          .dashboard-content-area { padding-bottom: 120px; }
        }
      `}</style>
    </div>
  );
};

/* User Overview Component */
const UserOverview = ({ activeBooking, bookings, parkingSpots, setActiveTab, navigate }) => {
  return (
    <div className="overview-tab fade-in">
      <div className="section-header">
        <h1>Driver Dashboard</h1>
        <p>Your parking hub. Find spots, manage bookings, and hit the road.</p>
      </div>

      {activeBooking && (
        <div className="active-booking-premium card">
          <div className="ab-status"><span className="pulse-dot"></span> Live Booking</div>
          <div className="ab-content">
            <div className="ab-info">
              <h2>{activeBooking.parking_spots?.name || 'Your Parking Spot'}</h2>
              <p><MapPin size={16} /> {activeBooking.parking_spots?.location || activeBooking.parking_spots?.address}</p>
            </div>
            <div className="ab-time">
              <Clock size={24} color="var(--primary-green)"/>
              <div className="time-details">
                <span className="label">Valid Until</span>
                <span className="val">{new Date(activeBooking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setActiveTab('bookings')}>Manage Booking</button>
          </div>
        </div>
      )}

      <div className="overview-grid">
        <div className="stat-card-premium card" onClick={() => setActiveTab('search')} style={{cursor:'pointer'}}>
          <div className="card-top">
            <div className="icon-box green"><MapIcon size={24} /></div>
            <span className="label">Quick Action</span>
          </div>
          <div className="card-body">
            <h2>Find Parking</h2>
            <div className="trend positive">
              <Search size={14} /> {parkingSpots.length} spots available near you
            </div>
          </div>
        </div>

        <div className="stat-card-premium card" onClick={() => setActiveTab('bookings')} style={{cursor:'pointer'}}>
          <div className="card-top">
            <div className="icon-box blue"><Bookmark size={24} /></div>
            <span className="label">Activity</span>
          </div>
          <div className="card-body">
            <h2>{bookings.length} Bookings</h2>
            <p className="sub-value">Total lifetime parking sessions</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections-grid">
        <div className="recent-activity card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
          </div>
          <div className="reservations-list">
            {bookings.slice(0,4).map(booking => (
              <div key={booking.id} className="reservation-item" onClick={() => setActiveTab('bookings')}>
                <div className="res-info">
                  <span className="res-user">{booking.parking_spots?.name || 'Parking Spot'}</span>
                  <span className="res-spot"><Clock size={12} /> {new Date(booking.start_time).toLocaleString([], {dateStyle:'medium'})}</span>
                </div>
                <div className="res-time">
                  <span className={`status-pill ${booking.status.toLowerCase()}`}>{booking.status}</span>
                </div>
                <ChevronRight size={18} className="res-arrow" />
              </div>
            ))}
            {bookings.length === 0 && <p className="no-data">No recent bookings</p>}
          </div>
        </div>

        <div className="featured-spots card">
          <div className="card-header">
            <h3>Suggested Spots</h3>
            <button className="text-btn" onClick={() => setActiveTab('search')}>View All</button>
          </div>
          <div className="reservations-list">
             {parkingSpots.slice(0,3).map(spot => (
              <div key={spot.id} className="reservation-item" onClick={() => navigate(`/parking/${spot.id}`)}>
                <div className="spot-thumb">
                  <img src={spot.image_url || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=200"} alt="spot" />
                </div>
                <div className="res-info">
                  <span className="res-user">{spot.name || spot.location}</span>
                  <span className="res-spot">₹{spot.price}/hr • {spot.parking_type || 'Car'}</span>
                </div>
                <ChevronRight size={18} className="res-arrow" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .overview-tab { display: flex; flex-direction: column; gap: 2rem; }
        .section-header h1 { font-size: 2.2rem; margin-bottom: 0.5rem; color: var(--text-dark); }
        .section-header p { color: var(--text-muted); }
        
        .active-booking-premium { background: linear-gradient(135deg, #0A4226 0%, #1A5F3A 100%); color: white; padding: 2rem; border-radius: 20px; position: relative; overflow: hidden; box-shadow: 0 15px 30px rgba(10, 66, 38, 0.2); }
        .ab-status { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1.5rem; }
        .pulse-dot { width: 8px; height: 8px; background: #2ECC71; border-radius: 50%; box-shadow: 0 0 10px #2ECC71; animation: pulse 2s infinite; }
        .ab-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; }
        .ab-info h2 { font-size: 2rem; margin-bottom: 0.5rem; }
        .ab-info p { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.8); }
        .ab-time { display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.1); padding: 1rem 1.5rem; border-radius: 12px; }
        .time-details { display: flex; flex-direction: column; }
        .time-details .label { font-size: 0.8rem; color: rgba(255,255,255,0.7); text-transform: uppercase; }
        .time-details .val { font-size: 1.25rem; font-weight: 700; }
        .active-booking-premium .btn-primary { background: white; color: var(--primary-green); font-weight: 800; border: none; }
        
        .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .stat-card-premium { padding: 1.75rem; transition: transform 0.3s; border: 1px solid var(--border-color); }
        .stat-card-premium:hover { transform: translateY(-5px); border-color: var(--primary-green); }
        .card-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .icon-box.green { background: rgba(46, 204, 113, 0.1); color: #2ECC71; }
        .icon-box.blue { background: rgba(52, 152, 219, 0.1); color: #3498DB; }
        .stat-card-premium h2 { font-size: 2rem; margin-bottom: 0.5rem; }
        .trend { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 600; }
        .trend.positive { color: #2ECC71; }
        .sub-value { font-size: 0.9rem; color: var(--text-muted); }
        
        .dashboard-sections-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
        .recent-activity { padding: 2rem; }
        .featured-spots { padding: 2rem; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
        .reservations-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .reservation-item { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: #F9F9F9; border-radius: 12px; transition: background 0.3s; cursor: pointer; }
        .reservation-item:hover { background: #F1F8F4; }
        .res-info { display: flex; flex-direction: column; flex: 1; }
        .res-user { font-weight: 700; margin-bottom: 4px; }
        .res-spot { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
        .res-arrow { color: var(--border-color); margin-left: 10px; }
        .status-pill { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .status-pill.active { background: #E8F5E9; color: #2ECC71; }
        .status-pill.confirmed { background: #E3F2FD; color: #3498DB; }
        .status-pill.pending { background: #FFF9E6; color: #F39C12; }
        .status-pill.completed { background: #F5F5F5; color: #7F8C8D; }
        .status-pill.cancelled { background: #FDEDEC; color: #E74C3C; }
        .spot-thumb { width: 50px; height: 50px; border-radius: 8px; overflow: hidden; margin-right: 12px; flex-shrink: 0;}
        .spot-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .no-data { text-align: center; color: var(--text-muted); font-style: italic; padding: 2rem; }
        .text-btn { background: none; border: none; color: var(--primary-green); font-weight: 600; cursor: pointer; }
        
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(46, 204, 113, 0); } 100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); } }
        
        @media (max-width: 992px) {
          .ab-content { flex-direction: column; align-items: flex-start; }
          .active-booking-premium .btn-primary { width: 100%; }
          .dashboard-sections-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

/* User Search Component (Simplified for UI flow) */
const UserSearch = ({ parkingSpots, navigate }) => {
  return (
    <div className="search-tab fade-in">
       <div className="section-header">
        <h1>Find Parking</h1>
      </div>
      <div className="search-grid">
        {parkingSpots.map(spot => (
          <div key={spot.id} className="owner-listing-card card premium" onClick={() => navigate(`/parking/${spot.id}`)} style={{cursor:'pointer'}}>
            <div className="listing-img-container">
              <img src={spot.image_url || "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800"} alt={spot.name} />
              <span className={`status-badge available`}>Available</span>
            </div>
            <div className="listing-body">
              <div className="listing-main">
                <div className="title-row">
                  <h3>{spot.name || spot.location}</h3>
                  <div className="rating"><Star size={14} fill="#FFD700" color="#FFD700"/> 4.8</div>
                </div>
                <p className="loc"><MapPin size={14} /> {spot.location}</p>
              </div>
              <div className="listing-meta">
                <div className="meta-item">
                  <span className="m-label">Hourly Rate</span>
                  <span className="m-value">₹{spot.price}/hr</span>
                </div>
                <div className="meta-item">
                  <span className="m-label">Type</span>
                  <span className="m-value">{spot.parking_type || 'Car'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style jsx="true">{`
        .section-header h1 { font-size: 2.2rem; margin-bottom: 2rem; color: var(--text-dark); }
        .search-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; }
        .owner-listing-card.premium { padding: 0; overflow: hidden; transition: transform 0.3s; }
        .owner-listing-card.premium:hover { transform: translateY(-8px); border: 1px solid var(--primary-green); }
        .listing-img-container { height: 200px; position: relative; }
        .listing-img-container img { width: 100%; height: 100%; object-fit: cover; }
        .status-badge { position: absolute; top: 12px; right: 12px; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; background: rgba(46, 204, 113, 0.9); color: white; }
        .listing-body { padding: 1.5rem; }
        .title-row { display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px; }
        .rating { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .loc { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-bottom: 1.25rem; }
        .listing-meta { display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid var(--border-color); }
        .m-label { font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px; }
        .m-value { font-weight: 700; font-size: 1rem; }
      `}</style>
    </div>
  );
};

const UserBookings = ({ bookings, navigate }) => {
  return (
    <div className="bookings-tab fade-in">
       <div className="section-header">
        <h1>My Bookings</h1>
      </div>
      <div className="bookings-list">
        {bookings.map(booking => (
          <div key={booking.id} className="booking-card card">
             <div className="b-header">
               <div>
                  <h3>{booking.parking_spots?.name || booking.parking_spots?.location}</h3>
                  <p className="loc"><MapPin size={14}/> {booking.parking_spots?.location}</p>
               </div>
               <span className={`status-pill ${(booking.status || 'Pending').toLowerCase()}`}>{booking.status || 'Pending'}</span>
             </div>
             <div className="b-details">
                <div className="b-time">
                  <Clock size={16} />
                  <span>{new Date(booking.start_time).toLocaleString()} - {new Date(booking.end_time).toLocaleTimeString()}</span>
                </div>
                <div className="b-price">
                  <strong>₹{booking.amount}</strong> Total
                </div>
              </div>
              <div className="b-actions">
                {booking.status === 'Pending' ? (
                  <div className="contact-owner">
                    <Phone size={14} /> Owner: {booking.parking_spots?.owner?.phone || 'Contact via support'}
                  </div>
                ) : booking.status === 'Cancelled' ? (
                  <div className="refund-info">
                    <AlertCircle size={14} /> Refund of ₹{booking.amount} will be credited to your account.
                  </div>
                ) : (
                  <button className="btn-chat-user" onClick={() => navigate(`/chat/${booking.id}`)} disabled={booking.status !== 'Confirmed' && booking.status !== 'Active'}>
                    <MessageSquare size={16} /> Chat with Owner
                  </button>
                )}
              </div>
           </div>
        ))}
        {bookings.length === 0 && <p>No bookings found.</p>}
      </div>
      <style jsx="true">{`
        .section-header h1 { font-size: 2.2rem; margin-bottom: 2rem; color: var(--text-dark); }
        .bookings-list { display: flex; flex-direction: column; gap: 1rem; }
        .booking-card { padding: 1.5rem; }
        .b-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
        .b-header h3 { margin-bottom: 4px; }
        .loc { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
        .b-details { display: flex; justify-content: space-between; align-items: center; }
        .b-time { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.95rem; }
        .b-price strong { font-size: 1.25rem; color: var(--primary-green); margin-right: 4px; }
        .b-actions { margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; }
        .contact-owner { background: #F1F8F4; color: var(--primary-green); padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .refund-info { background: #FFF5F5; color: #E74C3C; padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .btn-chat-user { background: var(--bg-cream); color: var(--primary-green); border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .btn-chat-user:disabled { opacity: 0.5; cursor: not-allowed; }
        .status-pill { padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .status-pill.active { background: #E8F5E9; color: #2ECC71; }
        .status-pill.confirmed { background: #E3F2FD; color: #3498DB; }
        .status-pill.pending { background: #FFF9E6; color: #F39C12; }
        .status-pill.completed { background: #F5F5F5; color: #7F8C8D; }
        .status-pill.cancelled { background: #FDEDEC; color: #E74C3C; }
      `}</style>
    </div>
  )
}

const UserSaved = () => <div className="fade-in"><h1>Saved Spots</h1><p>Feature coming soon...</p></div>;

const UserProfile = ({ profile, refresh }) => {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    address: profile?.address || '',
    avatar_url: profile?.avatar_url || '',
    notifications: true,
    twoFactor: false
  });
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData({ ...formData, avatar_url: publicUrl });
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          avatar_url: formData.avatar_url
        })
        .eq('id', user.id);

      if (error) throw error;
      alert('Profile updated successfully!');
      refresh();
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="profile-settings fade-in">
      <div className="section-header">
        <h1>Driver Profile Settings</h1>
        <p>Update your personal information, address, and upload an avatar.</p>
      </div>

      <div className="profile-grid">
        <div className="main-form card">
          <div className="profile-header-edit">
            <div className="avatar-upload-container">
              <div className="profile-avatar-lg" style={{backgroundImage: `url(${formData.avatar_url || 'https://via.placeholder.com/150'})`}}>
                <button className="edit-avatar-btn" onClick={() => document.getElementById('avatarInput').click()}>
                  {uploadingAvatar ? <Loader2 size={16} className="spin" /> : <ImageIcon size={16} />}
                </button>
                <input type="file" id="avatarInput" hidden accept="image/*" onChange={handleAvatarUpload} />
              </div>
            </div>
            <div className="header-text">
              <h3>Driver Account Details</h3>
              <p>ID: {profile?.id?.slice(0, 8)}...</p>
            </div>
          </div>
          <form onSubmit={handleUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-group" style={{marginTop: '1rem'}}>
              <label>Home Address</label>
              <textarea 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                placeholder="Fill in your home address"
                rows="2"
              />
            </div>
            <div className="form-group" style={{marginTop: '1rem'}}>
              <label>Email Address (read-only)</label>
              <input type="email" value={formData.email} disabled />
            </div>
            <button className="btn-primary" type="submit" disabled={updating} style={{marginTop: '2rem'}}>
              {updating ? "Saving Changes..." : "Update Driver Profile"}
            </button>
          </form>
        </div>

        <div className="sidebar-widgets">
          <div className="health-card card">
            <div className="health-score">
              <div className="score-ring">
                <div className="ring-inner">92%</div>
              </div>
              <div className="score-info">
                <h4>Driver Level</h4>
                <p>Frequent parker status active</p>
              </div>
            </div>
            <button className="btn-text">Improve Score <ChevronRight size={14} /></button>
          </div>

          <div className="verification-card card">
            <div className="v-item">
              <CheckCircle2 size={18} color="#2ECC71" />
              <span>Identity Verified</span>
            </div>
            <div className="v-item">
              <CheckCircle2 size={18} color="#2ECC71" />
              <span>Phone Verified</span>
            </div>
            <div className="v-item">
              <CheckCircle2 size={18} color="#2ECC71" />
              <span>Driver's License Sync</span>
            </div>
          </div>

          <div className="settings-widget card">
            <h4>Preferences</h4>
            <div className="toggle-item">
              <span>Email Booking Confirmation</span>
              <div className="toggle active"></div>
            </div>
            <div className="toggle-item">
              <span>SMS Parking Reminders</span>
              <div className="toggle"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .profile-settings { max-width: 1000px; }
        .section-header { margin-bottom: 2.5rem; }
        .section-header h1 { font-size: 2rem; color: var(--text-dark); margin-bottom: 0.5rem; }
        .section-header p { color: var(--text-muted); }
        .profile-grid { display: grid; grid-template-columns: 1fr 300px; gap: 2rem; margin-top: 2rem; }
        .main-form { padding: 2.5rem; }
        .main-form h3 { margin-bottom: 2rem; font-size: 1.25rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9rem; color: var(--text-dark); }
        .form-group input { width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 10px; background: #F9F9F9; }
        .form-group input:focus { border-color: var(--primary-green); background: white; outline: none; }
        .sidebar-widgets { display: flex; flex-direction: column; gap: 1.5rem; }
        .health-card { padding: 1.5rem; }
        .health-score { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1rem; }
        .score-ring { width: 60px; height: 60px; border-radius: 50%; border: 4px solid var(--primary-green); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--primary-green); }
        .score-info h4 { margin: 0; font-size: 1rem; }
        .score-info p { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
        .verification-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .v-item { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 600; }
        .settings-widget { padding: 1.5rem; }
        .settings-widget h4 { margin-bottom: 1.25rem; font-size: 1rem; }
        .toggle-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 0.9rem; }
        .toggle { width: 40px; height: 20px; background: #E0E0E0; border-radius: 20px; position: relative; cursor: pointer; }
        .toggle.active { background: var(--primary-green); }
        .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.3s; }
        .toggle.active::after { left: 22px; }
        .btn-text { background: none; color: var(--primary-green); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 4px; padding: 0; }
        
        .profile-header-edit { display: flex; gap: 2rem; align-items: center; margin-bottom: 2.5rem; }
        .profile-avatar-lg { width: 100px; height: 100px; border-radius: 50%; background-size: cover; position: relative; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background-position: center; }
        .edit-avatar-btn { position: absolute; bottom: 0; right: 0; width: 32px; height: 32px; border-radius: 50%; background: var(--primary-green); color: white; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default UserDashboard;
