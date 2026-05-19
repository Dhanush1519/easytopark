import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, MapPin, Plus, TrendingUp, Clock, DollarSign, 
  LogOut, CheckCircle2, Loader2, Calendar, ClipboardList, 
  Image as ImageIcon, Video, Car, Info, ChevronRight, ChevronLeft,
  X, Phone, MessageSquare, AlertCircle, Trash2, Search, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [wizardStep, setWizardStep] = useState(1);
  const [slotStatus, setSlotStatus] = useState('Available');
  const [profileImage, setProfileImage] = useState(null);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    monthEarnings: 0,
    totalBookings: 0,
    upcomingReservations: []
  });
  const [selectedBookingForChat, setSelectedBookingForChat] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOwnerData();

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const subscription = supabase
        .channel('public:owner_dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
          fetchOwnerData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_spots' }, () => {
          fetchOwnerData();
        })
        .subscribe();
        
      return () => supabase.removeChannel(subscription);
    };

    const unsubscribe = setupSubscription();
    return () => { unsubscribe.then(unsub => unsub && unsub()); };
  }, []);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = localStorage.getItem('admin_session') === 'true';
      
      if (!user && !isAdmin) {
        navigate('/login');
        return;
      }

      // If admin is previewing, skip real data fetching to avoid errors
      if (isAdmin && !user) {
        setProfile({ full_name: 'Admin Preview', role: 'owner' });
        setLoading(false);
        return;
      }

      // Fetch Profile, Listings, and Bookings in parallel
      const [profileRes, listingsRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('parking_spots').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, parking_spots!inner(name, owner_id), user:profiles!bookings_user_id_fkey(full_name)').eq('parking_spots.owner_id', user.id)
      ]);

      if (profileRes.error && profileRes.error.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileRes.error);
      }
      
      const ownerProfile = profileRes.data || { full_name: user.email.split('@')[0] };
      const ownerListings = listingsRes.data || [];
      const ownerBookings = bookingsRes.data || [];

      setProfile(ownerProfile);
      setListings(ownerListings);
      setBookings(ownerBookings);

      // Calculate Real Stats
      calculateStats(ownerBookings);
      
      if (ownerListings.length > 0) {
        setSlotStatus(ownerListings[0].status || 'Available');
      }
    } catch (err) {
      console.error('Error fetching owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (allBookings) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);

    let todayTotal = 0;
    let monthTotal = 0;
    const upcoming = [];

    allBookings.forEach(booking => {
      const bDate = new Date(booking.start_time);
      const bDateStr = bDate.toISOString().split('T')[0];
      const bMonthStr = bDateStr.substring(0, 7);

      if (['Completed', 'Upcoming', 'Active', 'Confirmed', 'Pending'].includes(booking.status)) {
        if (bDateStr === todayStr) todayTotal += parseFloat(booking.amount || 0);
        if (bMonthStr === monthStr) monthTotal += parseFloat(booking.amount || 0);
      }

      const bEndDate = new Date(booking.end_time);
      if (['Upcoming', 'Active', 'Confirmed', 'Pending'].includes(booking.status) && bEndDate >= now) {
        upcoming.push({
          id: booking.id,
          user: booking.user?.full_name || 'Guest',
          time: new Date(booking.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
          spot: booking.parking_spots?.name
        });
      }
    });

    setStats({
      todayEarnings: todayTotal,
      monthEarnings: monthTotal,
      totalBookings: allBookings.length,
      upcomingReservations: upcoming.slice(0, 3) // Show top 3
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const updateSlotStatus = async (newStatus) => {
    if (listings.length === 0) return;
    
    try {
      setSlotStatus(newStatus);
      const { error } = await supabase
        .from('parking_spots')
        .update({ status: newStatus })
        .eq('id', listings[0].id); // Update the first listing for now

      if (error) throw error;
      fetchOwnerData(); // Refresh
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleBookingAction = async (bookingId, newStatus, spotId) => {
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Auto-Occupancy Logic: If confirmed, mark spot as Full
      if (newStatus === 'Confirmed' && spotId) {
        await supabase
          .from('parking_spots')
          .update({ status: 'Full' })
          .eq('id', spotId);
      }

      fetchOwnerData(); // Refresh data
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Action failed');
    }
  };

  return (
    <div className="owner-dashboard fade-in">
      <div className="dashboard-container">
        <header className="dashboard-header glass">
          <div className="header-left">
            <div className="logo-container">
              <div className="car-logo"><Car size={24} /></div>
              <span className="brand-name">Easy <span className="green-text">Park</span></span>
            </div>
          </div>
          
          <div className="header-center">
            <div className="search-widget">
              <Search size={18} />
              <input type="text" placeholder="Search bookings, slots..." />
            </div>
          </div>
          
          <div className="header-right">
            <div className="header-profile" onClick={() => setActiveTab('profile')}>
              <div className="profile-text">
                <span className="name">{profile?.full_name || 'Owner'}</span>
                <span className="role">Parking Host</span>
              </div>
              <div className="avatar" style={{background: 'var(--primary-green)'}}>
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'O'}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-main">
          <aside className="dashboard-sidebar-floating card">
            <nav className="dashboard-nav">
              <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <LayoutDashboard size={20} /> <span className="nav-label">Dashboard</span>
              </button>
              <button className={`nav-item ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
                <ClipboardList size={20} /> <span className="nav-label">My Listings</span>
              </button>
              <button className={`nav-item ${activeTab === 'add' ? 'active' : ''}`} onClick={() => { setActiveTab('add'); setWizardStep(1); }}>
                <Plus size={20} /> <span className="nav-label">Add New Slot</span>
              </button>
              <button className={`nav-item ${activeTab === 'availability' ? 'active' : ''}`} onClick={() => setActiveTab('availability')}>
                <Calendar size={20} /> <span className="nav-label">Availability</span>
              </button>
              <button className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                <Clock size={20} /> <span className="nav-label">Bookings</span>
              </button>
              <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                <User size={20} /> <span className="nav-label">Profile Settings</span>
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
                <p>Curating your experience...</p>
              </div>
            ) : (
              <div className="tab-container">
                {activeTab === 'overview' && <Overview stats={stats} slotStatus={slotStatus} setSlotStatus={updateSlotStatus} />}
                {activeTab === 'listings' && <MyListings listings={listings} navigate={navigate} refresh={fetchOwnerData} />}
                {activeTab === 'add' && <AddParkingWizard step={wizardStep} setStep={setWizardStep} onComplete={fetchOwnerData} setActiveTab={setActiveTab} />}
                {activeTab === 'availability' && <AvailabilityCalendar listings={listings} />}
                {activeTab === 'bookings' && <BookingManagement bookings={bookings} onAction={(bid, stat) => {
                  const b = bookings.find(x => x.id === bid);
                  handleBookingAction(bid, stat, b?.spot_id);
                }} onChat={setSelectedBookingForChat} />}
                {activeTab === 'profile' && <ProfileSettings profile={profile} refresh={fetchOwnerData} />}
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedBookingForChat && (
        <ChatModal 
          booking={selectedBookingForChat} 
          onClose={() => setSelectedBookingForChat(null)} 
          currentUserId={profile?.id}
        />
      )}

      <style jsx="true">{`
        .owner-dashboard {
          min-height: 100vh;
          background: #F8FAFC;
          padding: 0;
        }

        .dashboard-header {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .car-logo {
          width: 44px;
          height: 44px;
          background: var(--primary-green);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px rgba(10, 66, 38, 0.15);
        }

        .brand-name {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .green-text { color: var(--primary-green); }

        .search-widget {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 10px 20px;
          border-radius: 30px;
          width: 400px;
          border: 1px solid var(--border-color);
          transition: all 0.3s;
        }

        .search-widget:focus-within {
          border-color: var(--primary-green);
          box-shadow: 0 0 0 4px rgba(10, 66, 38, 0.05);
        }

        .search-widget input {
          border: none;
          background: none;
          width: 100%;
          outline: none;
          font-size: 0.95rem;
        }

        .header-profile {
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 40px;
          transition: all 0.3s;
        }

        .header-profile:hover {
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .profile-text {
          text-align: right;
        }

        .profile-text .name {
          display: block;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-dark);
        }

        .profile-text .role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; }

        .dashboard-main {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 0;
          min-height: calc(100vh - 80px);
        }

        .dashboard-sidebar-floating {
          padding: 2rem 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          border-right: 1px solid var(--border-color);
          background: white;
          margin: 0;
          border-radius: 0;
        }

        .dashboard-nav {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          flex: 1;
        }

        .nav-item {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: none;
          position: relative;
        }

        .nav-label {
          position: absolute;
          left: 65px;
          background: var(--text-dark);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          opacity: 0;
          visibility: hidden;
          transition: 0.3s;
          white-space: nowrap;
        }

        .nav-item:hover .nav-label {
          opacity: 1;
          visibility: visible;
          left: 60px;
        }

        .nav-item:hover {
          color: var(--primary-green);
          background: var(--bg-cream);
        }

        .nav-item.active {
          background: var(--primary-green);
          color: white;
          box-shadow: 0 8px 20px rgba(10, 66, 38, 0.2);
        }

        .dashboard-content-area {
          padding: 2.5rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .logout-btn-minimal {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E74C3C;
          background: rgba(231, 76, 60, 0.05);
          transition: 0.3s;
          margin-top: auto;
        }

        .logout-btn-minimal:hover {
          background: #E74C3C;
          color: white;
        }

        @media (max-width: 992px) {
          .dashboard-header { padding: 0 1.5rem; }
          .search-widget { display: none; }
          .dashboard-main { grid-template-columns: 1fr; }
          .dashboard-sidebar-floating {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            height: 70px;
            flex-direction: row;
            padding: 0 1.5rem;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            z-index: 1000;
          }
          .dashboard-nav { flex-direction: row; width: 100%; justify-content: space-around; }
          .logout-btn-minimal { display: none; }
          .dashboard-content-area { padding-bottom: 120px; }
        }
      `}</style>
    </div>
  );
};

const Overview = ({ stats, slotStatus, setSlotStatus }) => {
  return (
    <div className="overview-tab fade-in">
      <div className="section-header">
        <h1>Control Panel</h1>
        <p>Welcome back! Here's how your listings are performing today.</p>
      </div>

      <div className="overview-grid">
        <div className="stat-card-premium card">
          <div className="card-top">
            <div className="icon-box green"><DollarSign size={24} /></div>
            <span className="label">Monthly Earnings</span>
          </div>
          <div className="card-body">
            <h2>₹{stats.monthEarnings.toLocaleString()}</h2>
            <div className="trend positive">
              <TrendingUp size={14} /> Tracking well this month
            </div>
          </div>
        </div>

        <div className="stat-card-premium card">
          <div className="card-top">
            <div className="icon-box blue"><ClipboardList size={24} /></div>
            <span className="label">Total Bookings</span>
          </div>
          <div className="card-body">
            <h2>{stats.totalBookings} Bookings</h2>
            <p className="sub-value">Earned ₹{stats.todayEarnings} today</p>
          </div>
        </div>

        <div className="stat-card-premium card">
          <div className="card-top">
            <div className="icon-box orange"><AlertCircle size={24} /></div>
            <span className="label">Slot Status</span>
          </div>
          <div className="card-body">
            <div className="status-toggle-container">
              <div className={`status-indicator ${slotStatus.toLowerCase()}`}></div>
              <select 
                value={slotStatus} 
                onChange={(e) => setSlotStatus(e.target.value)}
                className="status-select"
              >
                <option value="Available">Available</option>
                <option value="Full">Full</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <p className="sub-value">Current visibility for your main slot</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections-grid">
        <div className="recent-activity card">
          <div className="card-header">
            <h3>Upcoming Reservations</h3>
          </div>
          <div className="reservations-list">
            {stats.upcomingReservations.length > 0 ? stats.upcomingReservations.map(res => (
              <div key={res.id} className="reservation-item">
                <div className="res-info">
                  <span className="res-user">{res.user}</span>
                  <span className="res-spot"><MapPin size={12} /> {res.spot}</span>
                </div>
                <div className="res-time">
                  <Clock size={14} /> {res.time}
                </div>
                <ChevronRight size={18} className="res-arrow" />
              </div>
            )) : (
              <p className="no-data">No upcoming reservations</p>
            )}
          </div>
        </div>

        <div className="earnings-chart card">
          <div className="card-header">
            <h3>Earnings Summary</h3>
            <div className="date-filter">This Month</div>
          </div>
          <div className="chart-placeholder">
            <TrendingUp size={48} color="rgba(10, 66, 38, 0.1)" />
            <p>Earnings visualization</p>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .overview-tab { display: flex; flex-direction: column; gap: 2rem; }
        .section-header h1 { font-size: 2.2rem; margin-bottom: 0.5rem; color: var(--text-dark); }
        .section-header p { color: var(--text-muted); }
        .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .stat-card-premium { padding: 1.75rem; transition: transform 0.3s; }
        .stat-card-premium:hover { transform: translateY(-5px); }
        .card-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .icon-box.green { background: rgba(46, 204, 113, 0.1); color: #2ECC71; }
        .icon-box.blue { background: rgba(52, 152, 219, 0.1); color: #3498DB; }
        .icon-box.orange { background: rgba(243, 156, 18, 0.1); color: #F39C12; }
        .stat-card-premium h2 { font-size: 2rem; margin-bottom: 0.5rem; }
        .trend { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 600; }
        .trend.positive { color: #2ECC71; }
        .sub-value { font-size: 0.9rem; color: var(--text-muted); }
        .status-toggle-container { display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem; }
        .status-indicator { width: 10px; height: 10px; border-radius: 50%; }
        .status-indicator.available { background: #2ECC71; box-shadow: 0 0 8px #2ECC71; }
        .status-indicator.full { background: #F39C12; box-shadow: 0 0 8px #F39C12; }
        .status-indicator.pending { background: #E74C3C; box-shadow: 0 0 8px #E74C3C; }
        .status-select { border: none; background: none; font-weight: 700; font-size: 1.1rem; padding: 0; cursor: pointer; }
        .dashboard-sections-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
        .recent-activity { padding: 2rem; }
        .earnings-chart { padding: 2rem; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
        .reservations-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .reservation-item { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: #F9F9F9; border-radius: 12px; transition: background 0.3s; cursor: pointer; }
        .reservation-item:hover { background: #F1F8F4; }
        .res-info { display: flex; flex-direction: column; flex: 1; }
        .res-user { font-weight: 700; margin-bottom: 2px; }
        .res-spot { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
        .res-time { font-size: 0.85rem; color: var(--primary-green); background: rgba(10, 66, 38, 0.05); padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; gap: 6px; font-weight: 600; }
        .res-arrow { color: var(--border-color); margin-left: 10px; }
        .chart-placeholder { height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 1rem; }
        .no-data { text-align: center; color: var(--text-muted); font-style: italic; padding: 2rem; }
      `}</style>
    </div>
  );
};

const MyListings = ({ listings, navigate, refresh }) => {
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const { error } = await supabase.from('parking_spots').delete().eq('id', id);
      if (error) throw error;
      refresh();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete');
    }
  };

  return (
    <div className="listings-tab fade-in">
      <div className="tab-header">
        <h1>My Parking Spots</h1>
      </div>

      <div className="listings-grid">
        {listings.length > 0 ? listings.map(listing => (
          <div key={listing.id} className="owner-listing-card card premium">
            <div className="listing-img-container">
              <img src={listing.image_url || "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800"} alt={listing.name} />
              <span className={`status-badge ${listing.status.toLowerCase()}`}>{listing.status}</span>
            </div>
            <div className="listing-body">
              <div className="listing-main">
                <div className="title-row">
                  <h3>{listing.name}</h3>
                  <button className="delete-btn" onClick={() => handleDelete(listing.id)}><Trash2 size={16} /></button>
                </div>
                <p className="loc"><MapPin size={14} /> {listing.location}</p>
              </div>
              <div className="listing-meta">
                <div className="meta-item">
                  <span className="m-label">Hourly Rate</span>
                  <span className="m-value">₹{listing.price}/hr</span>
                </div>
                <div className="meta-item">
                  <span className="m-label">Type</span>
                  <span className="m-value">{listing.parking_type || 'Car'}</span>
                </div>
              </div>
              <div className="listing-actions">
                <button className="btn-secondary" onClick={() => navigate(`/parking/${listing.id}`)}>Edit Details</button>
                <button className="btn-outline-icon"><Calendar size={18} /></button>
              </div>
            </div>
          </div>
        )) : (
          <div className="empty-state card">
            <MapPin size={64} color="var(--border-color)" />
            <h3>No listings yet</h3>
            <p>Start earning by listing your empty parking space.</p>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; }
        .owner-listing-card.premium { padding: 0; overflow: hidden; transition: transform 0.3s; }
        .owner-listing-card.premium:hover { transform: translateY(-8px); }
        .listing-img-container { height: 180px; position: relative; }
        .listing-img-container img { width: 100%; height: 100%; object-fit: cover; }
        .status-badge { position: absolute; top: 12px; right: 12px; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
        .status-badge.available { background: rgba(46, 204, 113, 0.9); color: white; }
        .status-badge.full { background: rgba(243, 156, 18, 0.9); color: white; }
        .status-badge.pending { background: rgba(231, 76, 60, 0.9); color: white; }
        .listing-body { padding: 1.5rem; }
        .title-row { display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px; }
        .delete-btn { color: #E74C3C; opacity: 0.6; transition: 0.3s; background: none; }
        .delete-btn:hover { opacity: 1; }
        .loc { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-bottom: 1.25rem; }
        .listing-meta { display: flex; justify-content: space-between; padding: 1rem 0; border-top: 1px solid var(--border-color); margin-bottom: 1.25rem; }
        .m-label { font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px; }
        .m-value { font-weight: 700; font-size: 1rem; }
        .listing-actions { display: flex; gap: 0.75rem; }
        .btn-secondary { flex: 1; padding: 10px; background: #F1F8F4; color: var(--primary-green); font-weight: 700; border-radius: 8px; }
        .btn-outline-icon { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--border-color); border-radius: 8px; color: var(--text-muted); background: none; }
        .empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 1.5rem; text-align: center; }
      `}</style>
    </div>
  );
};

const AddParkingWizard = ({ step, setStep, onComplete, setActiveTab }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    parkingType: 'Car',
    covered: true,
    vehicleSize: 'Sedan',
    floorNumber: '',
    entryInstructions: '',
    price: '',
    priceDaily: '',
    priceMonthly: '',
    imageUrl: '',
    availabilitySlots: ['09:00 AM - 06:00 PM']
  });
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('parking-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('parking-images')
        .getPublicUrl(fileName);

      const currentImages = formData.images || [];
      setFormData({ ...formData, images: [...currentImages, publicUrl], imageUrl: publicUrl });
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('parking_spots').insert([{
        owner_id: user.id,
        name: formData.name || formData.location,
        location: formData.location,
        parking_type: formData.parkingType,
        covered: formData.covered,
        vehicle_size: formData.vehicleSize,
        floor_number: formData.floorNumber,
        entry_instructions: formData.entryInstructions,
        price: parseFloat(formData.price),
        price_daily: parseFloat(formData.priceDaily),
        price_monthly: parseFloat(formData.priceMonthly),
        availability_slots: formData.availabilitySlots,
        images: formData.images || [],
        image_url: formData.imageUrl || (formData.images?.[0]) || "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800",
        status: 'Available'
      }]);

      if (error) throw error;
      onComplete();
      setActiveTab('listings');
    } catch (err) {
      console.error('Publish error:', err);
      alert('Failed to publish listing: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="wizard-tab fade-in">
      <div className="wizard-header">
        <h1>List Your Space</h1>
        <div className="step-indicator">
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`step-dot ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
              <span className="dot-num">{s}</span>
              <span className="dot-label">
                {s === 1 && "Location"}
                {s === 2 && "Details"}
                {s === 3 && "Media"}
                {s === 4 && "Pricing"}
                {s === 5 && "Availability"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-card card">
        {step === 1 && (
          <div className="step-content fade-in">
            <h3>Step 1: Where is your parking?</h3>
            <div className="form-group">
              <label>Listing Name (e.g., My Home Slot)</label>
              <input type="text" placeholder="e.g., Downtown Secure Parking" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Location / Address</label>
              <input type="text" placeholder="Start typing address..." value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Entry Instructions</label>
              <textarea 
                placeholder="e.g. Turn left at the gate, park at slot B-12..." 
                value={formData.entry_instructions} 
                onChange={e => setFormData({...formData, entry_instructions: e.target.value})} 
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Parking Type</label>
              <div className="radio-grid">
                <button className={`radio-btn ${formData.parkingType === 'Car' ? 'active' : ''}`} onClick={() => setFormData({...formData, parkingType: 'Car'})}>Car</button>
                <button className={`radio-btn ${formData.parkingType === 'Bike' ? 'active' : ''}`} onClick={() => setFormData({...formData, parkingType: 'Bike'})}>Bike</button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content fade-in">
            <h3>Step 2: Space details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Vehicle Size compatibility</label>
                <select value={formData.vehicle_size} onChange={e => setFormData({...formData, vehicle_size: e.target.value})}>
                  <option value="Sedan">Sedan / Hatchback</option>
                  <option value="SUV">SUV / Luxury</option>
                  <option value="Truck">Truck / Large</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content fade-in">
            <h3>Step 3: Add Photos</h3>
            <div className="form-group">
              <label>Parking Photos (Add more than one)</label>
              <div className="photos-grid">
                {formData.images?.map((url, idx) => (
                  <div key={idx} className="photo-preview" style={{backgroundImage: `url(${url})`}}>
                    <button className="remove-photo" onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})}><X size={12}/></button>
                  </div>
                ))}
                <div className="upload-box-mini" onClick={() => document.getElementById('fileInput').click()}>
                  {uploading ? <Loader2 size={24} className="spin" /> : <Plus size={24} />}
                  <span>{uploading ? '...' : 'Add'}</span>
                  <input type="file" id="fileInput" hidden accept="image/*" onChange={handleFileUpload} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content fade-in">
            <h3>Step 4: Set Your Rates</h3>
            <div className="pricing-grid">
              <div className="price-input">
                <span className="p-label">Hourly</span>
                <div className="input-wrap">
                  <span className="curr">₹</span>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>
              <div className="price-input">
                <span className="p-label">Daily</span>
                <div className="input-wrap">
                  <span className="curr">₹</span>
                  <input type="number" value={formData.priceDaily} onChange={e => setFormData({...formData, priceDaily: e.target.value})} />
                </div>
              </div>
              <div className="price-input">
                <span className="p-label">Monthly</span>
                <div className="input-wrap">
                  <span className="curr">₹</span>
                  <input type="number" value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step-content fade-in">
            <h3>Step 5: Availability Setup</h3>
            <div className="slots-container">
              {formData.availabilitySlots.map((slot, i) => (
                <div key={i} className="slot-item">
                  <Clock size={18} /> {slot}
                </div>
              ))}
              <button className="btn-add-slot"><Plus size={16} /> Add Custom Time Slot</button>
            </div>
            <div className="days-selector">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <button key={day} className="day-btn active">{day}</button>
              ))}
            </div>
          </div>
        )}

        <div className="wizard-footer">
          <button className="btn-back" onClick={prevStep} disabled={step === 1}>
            <ChevronLeft size={20} /> Back
          </button>
          <button className="btn-next btn-primary" onClick={step === 5 ? handleComplete : nextStep} disabled={publishing}>
            {publishing ? "Publishing..." : step === 5 ? "Publish Listing" : "Next Step"} <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <style jsx="true">{`
        .wizard-tab { max-width: 800px; margin: 0 auto; }
        .wizard-header { text-align: center; margin-bottom: 3rem; }
        .wizard-header h1 { font-size: 2.2rem; margin-bottom: 2rem; }
        .step-indicator { display: flex; justify-content: space-between; position: relative; max-width: 600px; margin: 0 auto; }
        .step-indicator::before { content: ''; position: absolute; top: 15px; left: 0; right: 0; height: 2px; background: var(--border-color); z-index: 1; }
        .step-dot { position: relative; z-index: 2; background: white; width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .step-dot.active { border-color: var(--primary-green); background: var(--primary-green); color: white; }
        .dot-num { font-size: 0.8rem; font-weight: 800; }
        .dot-label { position: absolute; top: 40px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); white-space: nowrap; left: 50%; transform: translateX(-50%); }
        .step-dot.active .dot-label { color: var(--primary-green); }
        .wizard-card { padding: 3rem; }
        .step-content h3 { margin-bottom: 2rem; font-size: 1.4rem; }
        .form-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-weight: 700; font-size: 0.95rem; }
        .form-group input, .form-group select, .form-group textarea { padding: 14px; border-radius: 12px; border: 1.5px solid var(--border-color); font-size: 1rem; }
        .radio-grid { display: flex; gap: 1rem; }
        .radio-btn { flex: 1; padding: 12px; border: 1.5px solid var(--border-color); border-radius: 12px; font-weight: 700; background: none; }
        .radio-btn.active { border-color: var(--primary-green); background: rgba(10, 66, 38, 0.05); color: var(--primary-green); }
        .upload-box { height: 150px; border: 2.5px dashed var(--border-color); border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; color: var(--text-muted); }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .p-label { display: block; font-weight: 700; margin-bottom: 10px; color: var(--text-muted); }
        .input-wrap { position: relative; }
        .curr { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-weight: 700; }
        .input-wrap input { width: 100%; padding-left: 30px; }
        .slots-container { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .slot-item { display: flex; align-items: center; gap: 12px; padding: 12px 18px; background: #F9F9F9; border-radius: 12px; font-weight: 600; }
        .btn-add-slot { background: none; color: var(--primary-green); font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .days-selector { display: flex; gap: 8px; flex-wrap: wrap; }
        .day-btn { width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid var(--border-color); font-weight: 700; background: none; }
        .day-btn.active { background: var(--primary-green); color: white; border-color: var(--primary-green); }
        .wizard-footer { margin-top: 3rem; display: flex; justify-content: space-between; padding-top: 2rem; border-top: 1px solid var(--border-color); }
        .btn-back { display: flex; align-items: center; gap: 8px; font-weight: 700; background: none; color: var(--text-muted); }
        .btn-next { display: flex; align-items: center; gap: 8px; padding: 12px 24px; }
      `}</style>
    </div>
  );
};

const AvailabilityCalendar = ({ listings, profile, refresh }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([
    { id: 1, time: '09:00 AM - 06:00 PM', status: 'Available' }
  ]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState('09:00 AM - 05:00 PM');
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentType, setPaymentType] = useState('upi');
  const [payoutData, setPayoutData] = useState({
    holderName: profile?.payout_info?.holderName || '',
    upiId: profile?.payout_info?.upiId || '',
    bankName: profile?.payout_info?.bankName || '',
    accountNumber: profile?.payout_info?.accountNumber || '',
    ifscCode: profile?.payout_info?.ifscCode || '',
    customDetails: profile?.payout_info?.customDetails || ''
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newSlotTime.trim()) return;
    setSlots([...slots, { id: Date.now(), time: newSlotTime, status: 'Available' }]);
    setNewSlotTime('09:00 AM - 05:00 PM');
    setShowAddSlot(false);
  };

  const handleToggleBlock = (id) => {
    setSlots(slots.map(s => s.id === id ? { ...s, status: s.status === 'Available' ? 'Blocked' : 'Available' } : s));
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payout_info = {
        type: paymentType,
        ...payoutData
      };

      const { error } = await supabase
        .from('profiles')
        .update({ payout_info })
        .eq('id', user.id);

      if (error) throw error;
      alert('Payout setup successfully configured!');
      setShowPaymentForm(false);
      refresh();
    } catch (err) {
      console.error('Error saving payout setup:', err);
      alert('Failed to save payout settings.');
    } finally {
      setSavingPayment(false);
    }
  };

  const daysInMonth = 30;
  const currentMonthName = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="availability-tab fade-in">
      <div className="section-header">
        <h1>Manage Availability & Payouts</h1>
        <p>Sync your calendar, block times, and manage payment methods for {listings.length} spots.</p>
      </div>

      <div className="availability-grid-layout">
        <div className="calendar-card card">
          <div className="calendar-header">
            <div className="current-month">{currentMonthName}</div>
            <div className="cal-nav">
              <button className="btn-icon" onClick={() => {
                const prev = new Date(selectedDate);
                prev.setMonth(prev.getMonth() - 1);
                setSelectedDate(prev);
              }}><ChevronLeft size={20} /></button>
              <button className="btn-icon" onClick={() => {
                const next = new Date(selectedDate);
                next.setMonth(next.getMonth() + 1);
                setSelectedDate(next);
              }}><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="cal-day-label">{d}</div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDate.getDate() === dayNum;
              return (
                <div 
                  key={i} 
                  className={`cal-date ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    const newD = new Date(selectedDate);
                    newD.setDate(dayNum);
                    setSelectedDate(newD);
                  }}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>

          <div className="availability-details card glass">
            <h3>Daily Schedule: {selectedDate.toLocaleDateString([], { month: 'long', day: 'numeric' })}</h3>
            <div className="schedule-list">
              {slots.map(slot => (
                <div key={slot.id} className={`schedule-item ${slot.status.toLowerCase()}`}>
                  <span className="time">{slot.time}</span>
                  <span className="status">{slot.status}</span>
                  <button className="btn-action" onClick={() => handleToggleBlock(slot.id)}>
                    {slot.status === 'Available' ? 'Block' : 'Unblock'}
                  </button>
                </div>
              ))}
            </div>
            
            {showAddSlot ? (
              <form onSubmit={handleAddSlot} className="add-slot-form">
                <input 
                  type="text" 
                  value={newSlotTime} 
                  onChange={e => setNewSlotTime(e.target.value)} 
                  placeholder="e.g. 09:00 AM - 05:00 PM"
                  required
                />
                <div className="form-actions">
                  <button type="submit" className="btn-save-slot">Add</button>
                  <button type="button" className="btn-cancel-slot" onClick={() => setShowAddSlot(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <button className="btn-primary-outline w-100" onClick={() => setShowAddSlot(true)}>+ Add New Time Slot</button>
            )}
          </div>
        </div>

        <div className="payout-card card">
          <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3>Payment & Payout Setup</h3>
          </div>
          
          <div className="payout-content">
            {profile?.payout_info && Object.keys(profile.payout_info).length > 0 ? (
              <div className="payout-active-info">
                <div className="active-pill">Active Payout Channel</div>
                <div className="payout-type-label" style={{ marginTop: '0.5rem' }}>
                  <strong>Type:</strong> {String(profile.payout_info.type || '').toUpperCase()}
                </div>
                <div className="payout-details-list" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <p><strong>Holder Name:</strong> {profile.payout_info.holderName || 'N/A'}</p>
                  {profile.payout_info.type === 'upi' && <p><strong>UPI ID:</strong> {profile.payout_info.upiId}</p>}
                  {profile.payout_info.type === 'bank' && (
                    <>
                      <p><strong>Bank Name:</strong> {profile.payout_info.bankName}</p>
                      <p><strong>Account Number:</strong> {profile.payout_info.accountNumber}</p>
                      <p><strong>IFSC Code:</strong> {profile.payout_info.ifscCode}</p>
                    </>
                  )}
                  {profile.payout_info.type === 'custom' && <p><strong>Details:</strong> {profile.payout_info.customDetails}</p>}
                </div>
                <button className="btn-primary w-100" onClick={() => setShowPaymentForm(true)}>Update Payout Method</button>
              </div>
            ) : (
              <div className="payout-empty">
                <DollarSign size={48} color="var(--primary-green)" style={{opacity:0.3, marginBottom:'1rem'}} />
                <h4>No payout method configured</h4>
                <p>Add a payout option to receive customer bookings directly to your bank account or UPI app.</p>
                <button className="btn-primary w-100" style={{marginTop:'1.5rem'}} onClick={() => setShowPaymentForm(true)}>
                  Add Custom Payment Setup
                </button>
              </div>
            )}

            {showPaymentForm && (
              <div className="payout-form-overlay fade-in">
                <div className="payout-form-container card">
                  <div className="form-header">
                    <h4>Payout Setup Form</h4>
                    <button className="close-btn" onClick={() => setShowPaymentForm(false)}><X size={18} /></button>
                  </div>
                  <form onSubmit={handleSavePayment}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Payout Option Type</label>
                      <select value={paymentType} onChange={e => setPaymentType(e.target.value)} style={{ width: '100%' }}>
                        <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="bank">Direct Bank Transfer</option>
                        <option value="custom">Custom Payment Method</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Account Holder Name</label>
                      <input 
                        type="text" 
                        value={payoutData.holderName} 
                        onChange={e => setPayoutData({...payoutData, holderName: e.target.value})} 
                        placeholder="Holder name"
                        style={{ width: '100%' }}
                        required
                      />
                    </div>

                    {paymentType === 'upi' && (
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>UPI ID</label>
                        <input 
                          type="text" 
                          value={payoutData.upiId} 
                          onChange={e => setPayoutData({...payoutData, upiId: e.target.value})} 
                          placeholder="username@okaxis"
                          style={{ width: '100%' }}
                          required
                        />
                      </div>
                    )}

                    {paymentType === 'bank' && (
                      <>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Bank Name</label>
                          <input 
                            type="text" 
                            value={payoutData.bankName} 
                            onChange={e => setPayoutData({...payoutData, bankName: e.target.value})} 
                            placeholder="e.g. State Bank of India"
                            style={{ width: '100%' }}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Account Number</label>
                          <input 
                            type="text" 
                            value={payoutData.accountNumber} 
                            onChange={e => setPayoutData({...payoutData, accountNumber: e.target.value})} 
                            placeholder="Account number"
                            style={{ width: '100%' }}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>IFSC Code</label>
                          <input 
                            type="text" 
                            value={payoutData.ifscCode} 
                            onChange={e => setPayoutData({...payoutData, ifscCode: e.target.value})} 
                            placeholder="SBIN0001234"
                            style={{ width: '100%' }}
                            required
                          />
                        </div>
                      </>
                    )}

                    {paymentType === 'custom' && (
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Custom Instructions / Payout Details</label>
                        <textarea 
                          value={payoutData.customDetails} 
                          onChange={e => setPayoutData({...payoutData, customDetails: e.target.value})} 
                          placeholder="Describe your custom payout arrangement..."
                          rows="3"
                          style={{ width: '100%' }}
                          required
                        />
                      </div>
                    )}

                    <div className="form-actions" style={{marginTop:'1.5rem'}}>
                      <button type="submit" className="btn-primary w-100" disabled={savingPayment}>
                        {savingPayment ? 'Saving Payout...' : 'Save Payout Details'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .availability-grid-layout { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; }
        .calendar-card { padding: 2rem; display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
        .calendar-header { display: flex; justify-content: space-between; margin-bottom: 2rem; grid-column: 1 / -1; }
        .current-month { font-size: 1.4rem; font-weight: 800; }
        .cal-nav { display: flex; gap: 10px; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
        .cal-day-label { text-align: center; font-weight: 800; color: var(--text-muted); font-size: 0.8rem; padding-bottom: 10px; }
        .cal-date { height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: #F9F9F9; font-weight: 700; cursor: pointer; transition: 0.3s; }
        .cal-date:hover { background: #EBF5FF; }
        .cal-date.selected { background: var(--primary-green); color: white; }
        .availability-details { padding: 1.5rem; }
        .schedule-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .schedule-item { display: flex; flex-direction: column; padding: 12px; border-radius: 10px; border-left: 4px solid #2ECC71; background: #F9F9F9; }
        .schedule-item.blocked { border-left-color: #E74C3C; }
        .time { font-weight: 700; font-size: 0.9rem; }
        .status { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #2ECC71; }
        .schedule-item.blocked .status { color: #E74C3C; }
        .btn-action { margin-top: 8px; font-size: 0.8rem; font-weight: 700; color: var(--primary-green); text-align: left; background: none; cursor: pointer; }
        .btn-primary-outline { border: 1.5px solid var(--primary-green); color: var(--primary-green); padding: 12px; border-radius: 10px; font-weight: 700; background: none; cursor: pointer; transition: 0.3s; }
        .btn-primary-outline:hover { background: rgba(10, 66, 38, 0.05); }
        .add-slot-form { display: flex; flex-direction: column; gap: 10px; padding: 10px; border: 1px solid var(--border-color); border-radius: 10px; }
        .add-slot-form input { padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); }
        .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-save-slot { padding: 6px 12px; background: var(--primary-green); color: white; font-weight: 700; border-radius: 6px; font-size: 0.85rem; }
        .btn-cancel-slot { padding: 6px 12px; background: #F5F5F5; color: var(--text-muted); font-weight: 700; border-radius: 6px; font-size: 0.85rem; }
        
        .payout-card { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; position: relative; }
        .payout-empty { text-align: center; padding: 2rem 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .payout-empty h4 { font-size: 1.1rem; margin-bottom: 8px; }
        .payout-empty p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }
        
        .payout-active-info { display: flex; flex-direction: column; gap: 1rem; }
        .active-pill { background: #E8F5E9; color: #2ECC71; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; padding: 6px 12px; border-radius: 20px; align-self: flex-start; }
        .payout-type-label { font-size: 0.95rem; }
        .payout-details-list { background: #F9F9F9; padding: 1.25rem; border-radius: 12px; font-size: 0.9rem; line-height: 1.6; }
        .payout-details-list p { margin: 0; }
        
        .payout-form-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.96); z-index: 100; border-radius: inherit; padding: 1.5rem; overflow-y: auto; }
        .payout-form-container { border: none; box-shadow: none; background: none; }
        .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .form-header h4 { font-size: 1.1rem; margin: 0; }
        .close-btn { background: none; color: var(--text-muted); cursor: pointer; }
      `}</style>
    </div>
  );
};

const BookingManagement = ({ bookings, onAction, onChat }) => {
  const [subTab, setSubTab] = useState('upcoming');

  // Group bookings by status groups
  const filtered = bookings.filter(b => {
    const status = b.status?.toLowerCase();
    if (subTab === 'upcoming') return status === 'upcoming' || status === 'confirmed' || status === 'pending';
    if (subTab === 'ongoing') return status === 'ongoing' || status === 'active';
    if (subTab === 'past') return status === 'completed' || status === 'cancelled';
    return false;
  });

  return (
    <div className="bookings-tab fade-in">
      <div className="section-header">
        <h1>Booking Management</h1>
        <div className="sub-tabs">
          <button className={`sub-tab ${subTab === 'upcoming' ? 'active' : ''}`} onClick={() => setSubTab('upcoming')}>Upcoming</button>
          <button className={`sub-tab ${subTab === 'ongoing' ? 'active' : ''}`} onClick={() => setSubTab('ongoing')}>Ongoing</button>
          <button className={`sub-tab ${subTab === 'past' ? 'active' : ''}`} onClick={() => setSubTab('past')}>Past</button>
        </div>
      </div>

      <div className="bookings-list">
        {filtered.length > 0 ? filtered.map(booking => (
          <div key={booking.id} className="booking-card card">
            <div className="booking-main">
              <div className="user-avatar">{booking.user?.full_name?.charAt(0) || 'G'}</div>
              <div className="booking-details">
                <div className="user-line">
                  <h3>{booking.user?.full_name || 'Guest'}</h3>
                  <span className={`status-pill ${(booking.status || 'Pending').toLowerCase()}`}>{booking.status || 'Pending'}</span>
                </div>
                <p className="vehicle"><Car size={14} /> {booking.vehicle_details || 'Vehicle info N/A'}</p>
                <p className="slot"><Clock size={14} /> {new Date(booking.start_time).toLocaleString()}</p>
              </div>
              <div className="booking-price">
                <span className="amt">₹{booking.amount}</span>
                <span className="pay-status">Paid</span>
              </div>
            </div>
            
            <div className="booking-actions">
              {booking.status === 'Pending' && (
                <>
                  <button className="btn-approve" onClick={() => onAction(booking.id, 'Confirmed')}>Approve</button>
                  <button className="btn-reject" onClick={() => onAction(booking.id, 'Cancelled')}>Reject</button>
                </>
              )}
              {booking.status === 'Upcoming' && (
                <>
                  <button className="btn-approve" onClick={() => onAction(booking.id, 'Active')}>Accept Request</button>
                  <button className="btn-reject" onClick={() => onAction(booking.id, 'Cancelled')}>Reject</button>
                </>
              )}
              {booking.status === 'Ongoing' && (
                <button className="btn-approve" onClick={() => onAction(booking.id, 'Completed')}>Mark Completed</button>
              )}
              <button 
                className="btn-chat" 
                onClick={() => onChat(booking)}
                disabled={booking.status !== 'Confirmed' && booking.status !== 'Active'}
                title={booking.status === 'Pending' ? "Chat available after approval" : "Chat"}
              >
                <MessageSquare size={18} />
              </button>
            </div>
          </div>
        )) : (
          <div className="empty-bookings card glass">
            <Clock size={48} className="muted-icon" />
            <p>No {subTab} bookings found.</p>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .sub-tabs { display: flex; gap: 1.5rem; margin-top: 1.5rem; border-bottom: 1px solid var(--border-color); }
        .sub-tab { padding: 12px 0; font-weight: 700; color: var(--text-muted); border-bottom: 3px solid transparent; background: none; }
        .sub-tab.active { color: var(--primary-green); border-color: var(--primary-green); }
        .bookings-list { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 2rem; }
        .booking-card { padding: 1.5rem; }
        .booking-main { display: flex; gap: 1.5rem; align-items: start; margin-bottom: 1.5rem; }
        .user-avatar { width: 44px; height: 44px; background: #F1F8F4; color: var(--primary-green); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
        .booking-details { flex: 1; }
        .user-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .vehicle, .slot { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
        .booking-price { text-align: right; }
        .amt { display: block; font-size: 1.2rem; font-weight: 800; color: var(--primary-green); }
        .pay-status { font-size: 0.7rem; font-weight: 800; color: #2ECC71; }
        .booking-actions { display: flex; gap: 1rem; padding-top: 1.25rem; border-top: 1px solid var(--border-color); }
        .btn-approve { flex: 2; padding: 10px; background: var(--primary-green); color: white; font-weight: 700; border-radius: 8px; }
        .btn-reject { flex: 1; padding: 10px; background: #FFF5F5; color: #E74C3C; font-weight: 700; border-radius: 8px; }
        .btn-chat { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: #F1F8F4; color: var(--primary-green); border-radius: 8px; }
        .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
        .status-pill.ongoing { background: #EBF5FF; color: #3498DB; }
        .status-pill.upcoming { background: #FFF9E6; color: #F39C12; }
        .status-pill.completed { background: #E6FFFA; color: #2ECC71; }
      `}</style>
    </div>
  );
};

const ChatModal = ({ booking, onClose, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel(`chat-${booking.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${booking.id}` }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [booking.id]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert([{
        booking_id: booking.id,
        sender_id: currentUserId,
        receiver_id: booking.user_id, // The person who booked
        content: newMessage
      }]);

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="chat-modal card">
        <div className="chat-header">
          <div className="chat-user-info">
            <div className="avatar sm">{booking.user?.full_name?.charAt(0)}</div>
            <div>
              <h4>{booking.user?.full_name || 'Guest'}</h4>
              <p>{booking.parking_spots?.name}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="chat-body">
          {loading ? (
            <div className="chat-loading"><Loader2 className="spin" /></div>
          ) : (
            <div className="messages-list">
              {messages.length > 0 ? messages.map(msg => (
                <div key={msg.id} className={`message-bubble ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}>
                  <p>{msg.content}</p>
                  <span className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )) : (
                <div className="empty-chat">No messages yet. Start the conversation!</div>
              )}
            </div>
          )}
        </div>

        <form className="chat-footer" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Type your message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="send-btn"><MessageSquare size={18} /></button>
        </form>
      </div>

      <style jsx="true">{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .chat-modal {
          width: 100%;
          max-width: 450px;
          height: 600px;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
          background: white;
        }
        .chat-header {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-cream);
        }
        .chat-user-info { display: flex; gap: 12px; align-items: center; }
        .chat-user-info h4 { margin: 0; font-size: 1rem; }
        .chat-user-info p { margin: 0; font-size: 0.75rem; color: var(--text-muted); }
        .chat-body { flex: 1; overflow-y: auto; padding: 1.5rem; background: #F9F9F9; }
        .messages-list { display: flex; flex-direction: column; gap: 1rem; }
        .message-bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; position: relative; }
        .message-bubble.sent { align-self: flex-end; background: var(--primary-green); color: white; border-bottom-right-radius: 2px; }
        .message-bubble.received { align-self: flex-start; background: white; border: 1px solid var(--border-color); border-bottom-left-radius: 2px; }
        .msg-time { font-size: 0.65rem; opacity: 0.7; margin-top: 4px; display: block; text-align: right; }
        .chat-footer { padding: 1.25rem; border-top: 1px solid var(--border-color); display: flex; gap: 10px; }
        .chat-footer input { flex: 1; padding: 12px; border: 1px solid var(--border-color); border-radius: 10px; }
        .send-btn { width: 44px; height: 44px; background: var(--primary-green); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .empty-chat { text-align: center; color: var(--text-muted); padding-top: 4rem; font-size: 0.9rem; }
        .chat-loading { display: flex; justify-content: center; align-items: center; height: 100%; }
        .avatar.sm { width: 36px; height: 36px; background: var(--primary-green); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .close-btn { background: none; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

const ProfileSettings = ({ profile, refresh }) => {
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
        <h1>Profile Management</h1>
        <p>Update your personal information and account security.</p>
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
              <h3>Account Details</h3>
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
                placeholder="Enter your registered address"
                rows="2"
              />
            </div>
            <div className="form-group" style={{marginTop: '1rem'}}>
              <label>Email Address (read-only)</label>
              <input type="email" value={formData.email} disabled />
            </div>
            <button className="btn-primary" type="submit" disabled={updating} style={{marginTop: '2rem'}}>
              {updating ? "Saving Changes..." : "Update Profile"}
            </button>
          </form>
        </div>

        <div className="sidebar-widgets">
          <div className="health-card card">
            <div className="health-score">
              <div className="score-ring">
                <div className="ring-inner">85%</div>
              </div>
              <div className="score-info">
                <h4>Profile Health</h4>
                <p>Complete verification to reach 100%</p>
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
            <div className="v-item pending">
              <AlertCircle size={18} color="#F39C12" />
              <span>Document Verification</span>
            </div>
          </div>

          <div className="settings-widget card">
            <h4>Preferences</h4>
            <div className="toggle-item">
              <span>Email Notifications</span>
              <div className="toggle active"></div>
            </div>
            <div className="toggle-item">
              <span>SMS Alerts</span>
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
        .v-item.pending { color: #F39C12; }
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
        
        .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; margin-top: 0.5rem; }
        .photo-preview { height: 80px; border-radius: 8px; background-size: cover; position: relative; border: 1px solid var(--border-color); background-position: center; }
        .remove-photo { position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; border-radius: 50%; background: #E74C3C; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; border: none; cursor: pointer; }
        .upload-box-mini { height: 80px; border-radius: 8px; border: 2px dashed var(--border-color); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); font-size: 0.7rem; transition: 0.2s; }
        .upload-box-mini:hover { border-color: var(--primary-green); color: var(--primary-green); }
        
        .availability-editor { display: flex; flex-direction: column; gap: 1rem; }
        .day-row { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #F9F9F9; border-radius: 10px; }
        .day-info { display: flex; align-items: center; gap: 10px; }
        .time-pickers { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
        .time-pickers input { padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default OwnerDashboard;


