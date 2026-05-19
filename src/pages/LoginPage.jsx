import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, User, ShieldCheck, ArrowRight, Loader2, Shield, Lock, Mail, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const LoginPage = () => {
  const [step, setStep] = useState(1); // 1: Info, 2: Phone OTP
  const [authMethod, setAuthMethod] = useState('email'); // 'phone' or 'email'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ phone: '', email: '', password: '', role: 'User' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Admin login state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminData, setAdminData] = useState({ email: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMethod === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({
          phone: formData.phone,
        });
        if (error) throw error;
        setStep(2);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const userRole = profileData?.role || data.user?.user_metadata?.role || 'user';

        if (userRole === 'admin') navigate('/admin-dashboard');
        else if (userRole === 'owner') navigate('/owner-dashboard');
        else navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes('phone provider')) {
        setError('Phone auth is not configured. Please use the Email option.');
      } else {
        setError(err.message || 'Invalid login credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminData.email,
        password: adminData.password,
      });

      if (error) throw error;

      // Verify it is actually an admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const userRole = profileData?.role || data.user?.user_metadata?.role || 'user';

      if (userRole !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. This account does not have admin privileges.');
      }

      navigate('/admin-dashboard');
    } catch (err) {
      console.error(err);
      setAdminError(err.message || 'Admin login failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const otpString = otp.join('');

    try {
      let result;
      if (authMethod === 'phone') {
        result = await supabase.auth.verifyOtp({
          phone: formData.phone,
          token: otpString,
          type: 'sms'
        });
      } else {
        result = await supabase.auth.verifyOtp({
          email: formData.email,
          token: otpString,
          type: 'email'
        });
      }

      if (result.error) throw result.error;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', result.data.user.id)
        .single();

      const userRole = profileData?.role || result.data.user.user_metadata.role || 'user';

      if (userRole === 'admin') navigate('/admin-dashboard');
      else if (userRole === 'owner') navigate('/owner-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  return (
    <div className="login-page">

      {/* ── Admin Login Overlay Panel ── */}
      {isAdminMode && (
        <div className="admin-overlay fade-in">
          <div className="admin-panel card">
            {/* Back button */}
            <button
              className="admin-back-btn"
              onClick={() => { setIsAdminMode(false); setAdminError(null); setAdminData({ email: '', password: '' }); }}
            >
              <ChevronLeft size={18} /> Back to Login
            </button>

            {/* Shield logo */}
            <div className="admin-logo-ring">
              <Shield size={32} />
            </div>

            <h2 className="admin-panel-title">Admin Access</h2>
            <p className="admin-panel-sub">Restricted to platform administrators only</p>

            {adminError && (
              <div className="admin-error fade-in">
                <Lock size={14} /> {adminError}
              </div>
            )}

            <form className="admin-form" onSubmit={handleAdminLogin}>
              <div className="admin-field">
                <Mail size={16} />
                <input
                  type="email"
                  placeholder="Admin email address"
                  required
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="admin-field">
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="Admin password"
                  required
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                />
              </div>
              <button type="submit" className="admin-submit-btn" disabled={adminLoading}>
                {adminLoading
                  ? <><Loader2 size={18} className="spin" /> Authenticating...</>
                  : <><ShieldCheck size={18} /> Enter Admin Dashboard</>
                }
              </button>
            </form>

            <p className="admin-disclaimer">
              🔒 All admin actions are logged and monitored.
            </p>
          </div>
        </div>
      )}

      {/* ── Regular Login Card ── */}
      <div className="login-card card fade-in">

        {/* ── Circular Admin Entry Button (top-right) ── */}
        <button
          className={`admin-toggle-btn ${isAdminMode ? 'active' : ''}`}
          onClick={() => { setIsAdminMode(true); setError(null); }}
          title="Admin Login"
          type="button"
        >
          <Shield size={18} />
        </button>

        <div className="login-header">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to Easy Park</p>
        </div>

        {error && (
          <div className="error-message fade-in">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form className="login-form" onSubmit={handleLogin}>

            <div className="input-group">
              <label><User size={18} /> I am a...</label>
              <select
                className="role-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="User">Driver (Find Parking)</option>
                <option value="Owner">Parking Owner (List Space)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Authentication Method</label>
              <div className="auth-toggle">
                <button
                  type="button"
                  className={authMethod === 'email' ? 'active' : ''}
                  onClick={() => setAuthMethod('email')}
                >
                  Email & Password
                </button>
                <button
                  type="button"
                  className={authMethod === 'phone' ? 'active' : ''}
                  onClick={() => setAuthMethod('phone')}
                >
                  Phone OTP
                </button>
              </div>
            </div>

            <div className="input-group">
              {authMethod === 'email' ? (
                <>
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <label style={{ marginTop: '0.5rem' }}>Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <label><Phone size={18} /> Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </>
              )}
            </div>

            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading
                ? <Loader2 size={18} className="spin" />
                : <>{authMethod === 'email' ? 'Login' : 'Send OTP'} <ArrowRight size={18} /></>
              }
            </button>

            <p className="auth-footer">
              Don't have an account? <Link to="/signup">Register</Link>
            </p>
          </form>
        ) : (
          <form className="login-form fade-in" onSubmit={handleVerifyOtp}>
            <div className="otp-container">
              <p className="otp-label">
                Enter 6-digit code sent to {authMethod === 'email' ? formData.email : formData.phone}
              </p>
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    className="otp-input"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        document.getElementById(`otp-${index - 1}`).focus();
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <><ShieldCheck size={18} /> Verify OTP</>}
            </button>
            <button type="button" className="resend-link" onClick={() => setStep(1)} disabled={loading}>
              Edit Details
            </button>
          </form>
        )}
      </div>

      <style jsx="true">{`
        /* ── Page Layout ── */
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-cream);
          padding: 2rem;
          position: relative;
        }

        /* ── Regular Login Card ── */
        .login-card {
          position: relative;
          width: 100%;
          max-width: 450px;
          padding: 3rem 2.5rem;
          text-align: center;
          overflow: hidden;
          z-index: 1;
        }

        /* ── Circular Admin Entry Button (top-right corner) ── */
        .admin-toggle-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0f4f0, #e8f5e9);
          color: var(--primary-green);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(10, 66, 38, 0.15);
          z-index: 10;
          box-shadow: 0 2px 8px rgba(10,66,38,0.08);
        }

        .admin-toggle-btn:hover {
          background: var(--primary-green);
          color: white;
          transform: rotate(10deg) scale(1.12);
          box-shadow: 0 6px 20px rgba(10, 66, 38, 0.25);
          border-color: var(--primary-green);
        }

        .admin-toggle-btn.active {
          background: var(--primary-green);
          color: white;
          border-color: var(--primary-green);
          box-shadow: 0 4px 16px rgba(10, 66, 38, 0.3);
        }

        /* ── Admin Overlay ── */
        .admin-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 30, 18, 0.88);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        /* ── Admin Panel Card ── */
        .admin-panel {
          position: relative;
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
          background: linear-gradient(160deg, #0d1f14 0%, #162b1e 50%, #0a1a10 100%);
          border: 1px solid rgba(46, 204, 113, 0.18);
          border-radius: 24px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(46,204,113,0.08);
          text-align: center;
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Admin Back Button ── */
        .admin-back-btn {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: 0.25s;
        }
        .admin-back-btn:hover {
          color: white;
          background: rgba(255,255,255,0.1);
        }

        /* ── Admin Shield Logo Ring ── */
        .admin-logo-ring {
          width: 72px;
          height: 72px;
          margin: 0.5rem auto 1.5rem;
          background: linear-gradient(135deg, rgba(46,204,113,0.2), rgba(46,204,113,0.05));
          border: 2px solid rgba(46, 204, 113, 0.35);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2ECC71;
          box-shadow: 0 0 30px rgba(46,204,113,0.15), inset 0 0 20px rgba(46,204,113,0.05);
        }

        .admin-panel-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.4rem;
          letter-spacing: -0.5px;
        }

        .admin-panel-sub {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          margin-bottom: 2rem;
        }

        /* ── Admin Error ── */
        .admin-error {
          background: rgba(231, 76, 60, 0.12);
          border: 1px solid rgba(231, 76, 60, 0.3);
          color: #ff7675;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
        }

        /* ── Admin Form ── */
        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-align: left;
        }

        .admin-field {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0 16px;
          transition: 0.25s;
        }

        .admin-field:focus-within {
          border-color: rgba(46, 204, 113, 0.5);
          background: rgba(46,204,113,0.05);
          box-shadow: 0 0 0 3px rgba(46,204,113,0.08);
        }

        .admin-field svg {
          color: rgba(255,255,255,0.3);
          flex-shrink: 0;
        }

        .admin-field input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: white;
          font-size: 0.95rem;
          padding: 14px 0;
        }

        .admin-field input::placeholder {
          color: rgba(255,255,255,0.3);
        }

        /* ── Admin Submit Button ── */
        .admin-submit-btn {
          margin-top: 0.5rem;
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #1a5f3a, #2ECC71);
          color: white;
          font-weight: 800;
          font-size: 1rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: 0.3s;
          box-shadow: 0 8px 24px rgba(46,204,113,0.25);
          letter-spacing: 0.3px;
        }

        .admin-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(46,204,113,0.35);
        }

        .admin-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Admin Disclaimer ── */
        .admin-disclaimer {
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.25);
          text-align: center;
        }

        /* ── Regular Form Styles ── */
        .login-header { margin-bottom: 2.5rem; }

        .login-title {
          font-size: 2rem;
          color: var(--primary-green);
          margin-bottom: 0.5rem;
        }

        .login-subtitle { color: var(--text-muted); }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          text-align: left;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--text-dark);
          font-size: 0.9rem;
        }

        .input-group input, .role-select {
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: #F9F9F9;
          font-size: 1rem;
          border: 1px solid var(--border-color);
          width: 100%;
          outline: none;
        }

        .input-group input:focus, .role-select:focus {
          border-color: var(--primary-green);
          background: white;
          box-shadow: 0 0 0 4px rgba(10, 66, 38, 0.1);
        }

        .auth-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #F0F0F0;
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          margin-bottom: 0.5rem;
        }

        .auth-toggle button {
          padding: 8px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-muted);
          background: transparent;
          transition: all 0.2s ease;
        }

        .auth-toggle button.active {
          background: white;
          color: var(--primary-green);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .login-btn {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 1.1rem;
          padding: 14px;
        }

        .auth-footer {
          text-align: center;
          margin-top: 0.5rem;
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .auth-footer a {
          color: var(--primary-green);
          font-weight: 700;
          text-decoration: none;
        }

        .otp-container { text-align: center; margin-bottom: 1rem; }

        .otp-label {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .otp-inputs {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .otp-input {
          width: 50px;
          height: 60px;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          border-radius: 12px;
          border: 2px solid var(--border-color);
          background: #F9F9F9;
          transition: var(--transition-smooth);
        }

        .otp-input:focus {
          border-color: var(--primary-green);
          background: white;
          box-shadow: 0 0 0 4px rgba(10, 66, 38, 0.1);
        }

        .resend-link {
          background: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-top: 0.5rem;
          text-decoration: underline;
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
        }

        .spin { animation: spin 1s linear infinite; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .fade-in {
          animation: fadeIn 0.35s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
