import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, MapPin, Calendar, TrendingUp, ShieldAlert, CheckCircle2, 
  XCircle, Loader2, Search, LogOut, Shield, DollarSign, Car, Briefcase, Bell, ChevronRight, Ban
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, users: 0, owners: 0, listings: 0 });

  useEffect(() => {
    fetchData();

    // Setup Realtime Sync for Admin to instantly see platform changes
    const setupSubscription = async () => {
      const subscription = supabase
        .channel('public:admin_dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchData(false))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_spots' }, () => fetchData(false))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData(false))
        .subscribe();
        
      return () => supabase.removeChannel(subscription);
    };

    const unsubscribe = setupSubscription();
    return () => { unsubscribe.then(unsub => unsub && unsub()); };
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Verify admin role from profiles table (most reliable source)
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (adminProfile?.role !== 'admin') {
        navigate('/login');
        return;
      }

      const [listingsRes, bookingsRes, profilesRes] = await Promise.all([
        supabase.from('parking_spots').select('*, profiles(full_name)').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, profiles(full_name), parking_spots(name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*')
      ]);

      setListings(listingsRes.data || []);
      setBookings(bookingsRes.data || []);
      setProfiles(profilesRes.data || []);
      
      const allBookings = bookingsRes.data || [];
      const allProfiles = profilesRes.data || [];
      const allListings = listingsRes.data || [];
      
      const totalRevenue = allBookings.reduce((sum, b) => sum + (['Completed', 'Active', 'Confirmed'].includes(b.status) ? (b.amount * 0.1) : 0), 0); // 10% commission
      
      setStats({
        revenue: totalRevenue,
        users: allProfiles.filter(p => p.role === 'user').length,
        owners: allProfiles.filter(p => p.role === 'owner').length,
        listings: allListings.length,
        activeBookings: allBookings.filter(b => ['Active', 'Confirmed', 'Pending'].includes(b.status)).length
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleAction = async (table, id, updates) => {
    try {
      const { error } = await supabase.from(table).update(updates).eq('id', id);
      if (error) throw error;
      fetchData(false); // Refresh without loader
    } catch (err) {
      alert("Action failed: " + err.message);
    }
  };

  const handleRemove = async (table, id) => {
    if(!confirm("Are you sure you want to delete this? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData(false);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="owner-dashboard admin-page fade-in">
      <div className="dashboard-container">
        <header className="dashboard-header glass">
          <div className="header-left">
            <div className="logo-container">
              <div className="car-logo" style={{background: '#2C3E50'}}><Shield size={24} /></div>
              <span className="brand-name">Easy Park <span style={{color:'#2C3E50', fontWeight:600}}>Admin</span></span>
            </div>
          </div>
          
          <div className="header-center">
            <div className="search-widget">
              <Search size={18} />
              <input type="text" placeholder="Search system logs, users, listings..." />
            </div>
          </div>
          
          <div className="header-right">
            <button className="icon-btn-minimal"><Bell size={20} /></button>
            <div className="header-profile">
              <div className="profile-text">
                <span className="name">Super Admin</span>
                <span className="role">System Access</span>
              </div>
              <div className="avatar" style={{background: '#2C3E50'}}>A</div>
            </div>
          </div>
        </header>

        <div className="dashboard-main">
          <aside className="dashboard-sidebar-floating card">
            <nav className="dashboard-nav">
              <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <LayoutDashboard size={20} /> <span className="nav-label">Overview</span>
              </button>
              <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                <Users size={20} /> <span className="nav-label">User Management</span>
              </button>
              <button className={`nav-item ${activeTab === 'owners' ? 'active' : ''}`} onClick={() => setActiveTab('owners')}>
                <Briefcase size={20} /> <span className="nav-label">Owner Management</span>
              </button>
              <button className={`nav-item ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
                <MapPin size={20} /> <span className="nav-label">Parking Spaces</span>
              </button>
              <button className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                <Calendar size={20} /> <span className="nav-label">Bookings & Revenue</span>
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
                <p>Loading administrative console...</p>
              </div>
            ) : (
              <div className="tab-container">
                {activeTab === 'overview' && <AdminOverview stats={stats} pendingListings={listings.filter(l => l.status === 'Pending')} />}
                {activeTab === 'users' && <UserManagement profiles={profiles.filter(p => p.role === 'user')} onAction={handleAction} onRemove={handleRemove} />}
                {activeTab === 'owners' && <OwnerManagement profiles={profiles.filter(p => p.role === 'owner')} onAction={handleAction} />}
                {activeTab === 'listings' && <ParkingManagement listings={listings} onAction={handleAction} onRemove={handleRemove} />}
                {activeTab === 'bookings' && <BookingManagement bookings={bookings} onAction={handleAction} stats={stats} />}
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
        .car-logo { width: 44px; height: 44px; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(44, 62, 80, 0.15); }
        .brand-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
        .search-widget { display: flex; align-items: center; gap: 12px; background: white; padding: 10px 20px; border-radius: 30px; width: 400px; border: 1px solid var(--border-color); transition: all 0.3s; }
        .search-widget:focus-within { border-color: #2C3E50; box-shadow: 0 0 0 4px rgba(44, 62, 80, 0.05); }
        .search-widget input { border: none; background: none; width: 100%; outline: none; font-size: 0.95rem; }
        .header-profile { display: flex; align-items: center; gap: 15px; cursor: pointer; padding: 8px 12px; border-radius: 40px; transition: all 0.3s; }
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
        .nav-item:hover { color: #2C3E50; background: rgba(44, 62, 80, 0.05); }
        .nav-item.active { background: #2C3E50; color: white; box-shadow: 0 8px 20px rgba(44, 62, 80, 0.2); }
        .dashboard-content-area { padding: 2.5rem; max-width: 1400px; margin: 0 auto; width: 100%; }
        .logout-btn-minimal { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #E74C3C; background: rgba(231, 76, 60, 0.05); transition: 0.3s; margin-top: auto; border: none; cursor: pointer; }
        .logout-btn-minimal:hover { background: #E74C3C; color: white; }
        
        .section-header h1 { font-size: 2.2rem; margin-bottom: 0.5rem; color: var(--text-dark); }
        .section-header p { color: var(--text-muted); margin-bottom: 2rem;}
        
        .admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .admin-table th, .admin-table td { padding: 1.25rem 1rem; text-align: left; border-bottom: 1px solid var(--border-color); }
        .admin-table th { color: var(--text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; background: #F9F9F9; }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table tr:hover { background: #F9F9F9; }
        
        .status-pill { padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: inline-block; }
        .status-pill.available, .status-pill.active { background: rgba(46, 204, 113, 0.1); color: #2ECC71; }
        .status-pill.pending, .status-pill.upcoming { background: rgba(243, 156, 18, 0.1); color: #F39C12; }
        .status-pill.blocked, .status-pill.cancelled { background: rgba(231, 76, 60, 0.1); color: #E74C3C; }
        .status-pill.completed { background: #F5F5F5; color: #7F8C8D; }
        
        .action-cell { display: flex; gap: 0.5rem; }
        .action-btn { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
        .action-btn.approve { color: #2ECC71; background: rgba(46, 204, 113, 0.1); }
        .action-btn.approve:hover { background: #2ECC71; color: white; }
        .action-btn.remove, .action-btn.reject { color: #E74C3C; background: rgba(231, 76, 60, 0.1); }
        .action-btn.remove:hover { background: #E74C3C; color: white; }
        .action-btn.neutral { color: var(--text-dark); background: #F5F5F5; }
        
        .truncate { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace;}
        
        @media (max-width: 992px) {
          .dashboard-header { padding: 0 1.5rem; }
          .search-widget, .profile-text { display: none; }
          .dashboard-main { grid-template-columns: 1fr; }
          .dashboard-sidebar-floating { position: fixed; bottom: 20px; left: 20px; right: 20px; height: 70px; flex-direction: row; padding: 0 1.5rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 1000; border: none; }
          .dashboard-nav { flex-direction: row; width: 100%; justify-content: space-around; }
          .nav-item .nav-label, .logout-btn-minimal { display: none; }
          .dashboard-content-area { padding-bottom: 120px; }
          .admin-table { display: block; overflow-x: auto; white-space: nowrap; }
        }
      `}</style>
    </div>
  );
};

/* --- Sub-components for Admin --- */

const AdminOverview = ({ stats, pendingListings }) => (
  <div className="overview-tab fade-in">
    <div className="section-header">
      <h1>Platform Overview</h1>
      <p>High-level metrics and system alerts.</p>
    </div>

    <div className="overview-grid">
      <div className="stat-card-premium card" style={{borderLeft: '4px solid #3498DB'}}>
        <div className="card-top">
          <div className="icon-box blue"><DollarSign size={24} /></div>
          <span className="label">Platform Revenue (10%)</span>
        </div>
        <div className="card-body">
          <h2>₹{stats.revenue.toLocaleString()}</h2>
          <div className="trend positive"><TrendingUp size={14} /> Total Lifetime</div>
        </div>
      </div>
      
      <div className="stat-card-premium card" style={{borderLeft: '4px solid #9B59B6'}}>
        <div className="card-top">
          <div className="icon-box" style={{color:'#9B59B6', background:'rgba(155, 89, 182, 0.1)'}}><Users size={24} /></div>
          <span className="label">Total Accounts</span>
        </div>
        <div className="card-body">
          <h2>{stats.users + stats.owners}</h2>
          <div className="sub-value">{stats.users} Drivers • {stats.owners} Owners</div>
        </div>
      </div>

      <div className="stat-card-premium card" style={{borderLeft: '4px solid #F39C12'}}>
        <div className="card-top">
          <div className="icon-box orange"><MapPin size={24} /></div>
          <span className="label">Active Parking Spots</span>
        </div>
        <div className="card-body">
          <h2>{stats.listings}</h2>
          <div className="sub-value">{stats.activeBookings} currently active bookings</div>
        </div>
      </div>
    </div>

    <div className="admin-section card mt-4">
      <h3>System Alerts & Actions</h3>
      <div style={{padding:'1rem'}}>
        {pendingListings.length > 0 ? (
          <div className="alert-item" style={{display:'flex', alignItems:'center', gap:'10px', background:'rgba(243, 156, 18, 0.1)', color:'#E67E22', padding:'1rem', borderRadius:'12px', fontWeight:600}}>
            <ShieldAlert size={20} />
            <span>{pendingListings.length} parking spots require manual approval before they go live on the platform.</span>
          </div>
        ) : (
          <p style={{color:'var(--text-muted)'}}>No pending approvals. Platform is running smoothly.</p>
        )}
      </div>
    </div>

    <style jsx="true">{`
      .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;}
      .stat-card-premium { padding: 1.75rem; transition: transform 0.3s; }
      .stat-card-premium:hover { transform: translateY(-5px); }
      .card-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
      .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      .icon-box.blue { background: rgba(52, 152, 219, 0.1); color: #3498DB; }
      .icon-box.orange { background: rgba(243, 156, 18, 0.1); color: #F39C12; }
      .stat-card-premium h2 { font-size: 2rem; margin-bottom: 0.5rem; }
      .trend { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 600; }
      .trend.positive { color: #2ECC71; }
      .sub-value { font-size: 0.9rem; color: var(--text-muted); }
      .mt-4 { margin-top: 2rem; }
      .admin-section h3 { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); margin: 0;}
    `}</style>
  </div>
);

const UserManagement = ({ profiles, onAction, onRemove }) => (
  <div className="fade-in">
    <div className="section-header"><h1>User Management</h1><p>Monitor and manage all driver accounts.</p></div>
    <table className="admin-table">
      <thead>
        <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
      </thead>
      <tbody>
        {profiles.map(p => (
          <tr key={p.id}>
            <td style={{fontWeight:600}}>{p.full_name || 'Anonymous'}</td>
            <td>{p.id.slice(0,10)}...@user</td>
            <td><span className="status-pill active" style={{background:'#E3F2FD', color:'#3498DB'}}>Driver</span></td>
            <td><span className={`status-pill ${p.status === 'Blocked' ? 'blocked' : 'available'}`}>{p.status || 'Active'}</span></td>
            <td className="action-cell">
               {p.status === 'Blocked' ? (
                 <button className="action-btn approve" onClick={() => onAction('profiles', p.id, { status: 'Active' })}><CheckCircle2 size={16}/> Unblock</button>
               ) : (
                 <button className="action-btn reject" onClick={() => onAction('profiles', p.id, { status: 'Blocked' })}><Ban size={16}/> Block</button>
               )}
               <button className="action-btn neutral"><Search size={16}/> Logs</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const OwnerManagement = ({ profiles, onAction }) => (
  <div className="fade-in">
    <div className="section-header"><h1>Owner Management</h1><p>Oversee parking space hosts.</p></div>
    <table className="admin-table">
      <thead>
        <tr><th>Name</th><th>Verification</th><th>Listings</th><th>Status</th><th>Action</th></tr>
      </thead>
      <tbody>
        {profiles.map(p => (
          <tr key={p.id}>
            <td style={{fontWeight:600}}>{p.full_name || 'Owner'}</td>
            <td>Verified <CheckCircle2 size={12} color="#2ECC71"/></td>
            <td>View Spaces</td>
            <td><span className={`status-pill ${p.status === 'Blocked' ? 'blocked' : 'available'}`}>{p.status || 'Active'}</span></td>
            <td className="action-cell">
               {p.status === 'Blocked' ? (
                 <button className="action-btn approve" onClick={() => onAction('profiles', p.id, { status: 'Active' })}>Unblock</button>
               ) : (
                 <button className="action-btn reject" onClick={() => onAction('profiles', p.id, { status: 'Blocked' })}>Suspend</button>
               )}
            </td>
          </tr>
        ))}
        {profiles.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>No owners found.</td></tr>}
      </tbody>
    </table>
  </div>
);

const ParkingManagement = ({ listings, onAction, onRemove }) => (
  <div className="fade-in">
    <div className="section-header"><h1>Parking Spaces</h1><p>Approve, reject, or edit listed spots.</p></div>
    <table className="admin-table">
      <thead>
        <tr><th>ID</th><th>Location Name</th><th>Owner</th><th>Price/hr</th><th>Status</th><th>Action</th></tr>
      </thead>
      <tbody>
        {listings.map(listing => (
          <tr key={listing.id}>
            <td className="truncate">#{listing.id.slice(0, 8)}</td>
            <td style={{fontWeight:600}}>{listing.name || listing.location}</td>
            <td>{listing.profiles?.full_name || 'Unknown'}</td>
            <td>₹{listing.price}</td>
            <td><span className={`status-pill ${listing.status?.toLowerCase() || 'pending'}`}>{listing.status || 'Pending'}</span></td>
            <td className="action-cell">
              {listing.status === 'Pending' ? (
                <button className="action-btn approve" onClick={() => onAction('parking_spots', listing.id, { status: 'Available' })}><CheckCircle2 size={16} /> Approve</button>
              ) : (
                <button className="action-btn reject" onClick={() => onAction('parking_spots', listing.id, { status: 'Pending' })}><Ban size={16} /> Suspend</button>
              )}
              <button className="action-btn remove" onClick={() => onRemove('parking_spots', listing.id)}><XCircle size={16} /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const BookingManagement = ({ bookings, onAction, stats }) => (
  <div className="fade-in">
    <div className="section-header">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h1>Bookings & Revenue</h1>
          <p>Monitor real-time transactions and resolve disputes.</p>
        </div>
        <div style={{background:'rgba(46, 204, 113, 0.1)', color:'#27AE60', padding:'10px 20px', borderRadius:'12px', fontWeight:700, fontSize:'1.2rem'}}>
          Platform Commission: ₹{stats.revenue.toLocaleString()}
        </div>
      </div>
    </div>
    
    <table className="admin-table">
      <thead>
        <tr><th>Booking ID</th><th>User</th><th>Location</th><th>Time</th><th>Amount</th><th>Status</th><th>Action</th></tr>
      </thead>
      <tbody>
        {bookings.map(booking => (
          <tr key={booking.id}>
            <td className="truncate">#{booking.id.slice(0, 8)}</td>
            <td style={{fontWeight:600}}>{booking.profiles?.full_name || 'Guest'}</td>
            <td>{booking.parking_spots?.name || 'Unknown Spot'}</td>
            <td style={{fontSize:'0.85rem'}}>{new Date(booking.start_time).toLocaleString([], {dateStyle:'short', timeStyle:'short'})}</td>
            <td style={{fontWeight:700}}>₹{booking.amount}</td>
            <td><span className={`status-pill ${booking.status.toLowerCase()}`}>{booking.status}</span></td>
            <td className="action-cell">
              {booking.status === 'Active' ? (
                <button className="action-btn remove" onClick={() => onAction('bookings', booking.id, { status: 'Cancelled' })}>Cancel</button>
              ) : (
                <button className="action-btn neutral" disabled>No Action</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default AdminDashboard;
