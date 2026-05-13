import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const LoginPage = () => {
  const [step, setStep] = useState(1); // 1: Info, 2: Phone OTP
  const [authMethod, setAuthMethod] = useState('email'); // 'phone' or 'email'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ phone: '', email: '', password: '', role: 'User' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
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
        // Email + Password Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Redirect based on role from metadata
        const userRole = data.user?.user_metadata?.role || 'user';
        
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

      // After verification, redirect based on role
      const userRole = result.data.user.user_metadata.role || 'user';
      
      if (userRole === 'admin') {
        navigate('/admin-dashboard');
      } else if (userRole === 'owner') {
        navigate('/owner-dashboard');
      } else {
        navigate('/dashboard');
      }
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
      
      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card fade-in">


        <div className="login-header">
          <h2 className="login-title">{formData.role === 'Admin' ? 'Admin Login' : 'User Login'}</h2>
          <p className="login-subtitle">Welcome to Easy Park</p>
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
                onChange={(e) => setFormData({...formData, role: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  <label style={{marginTop: '0.5rem'}}>Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter your password" 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </>
              )}
            </div>

                <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <>{authMethod === 'email' ? 'Login' : 'Send OTP'} <ArrowRight size={18} /></>}
            </button>
            
            <p className="auth-footer" style={{textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem'}}>
              Don't have an account? <Link to="/signup" style={{color: 'var(--primary-green)', fontWeight: '700', textDecoration: 'none'}}>Register</Link>
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
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-cream);
          padding: 2rem;
        }
        
        .login-card {
          position: relative;
          width: 100%;
          max-width: 450px;
          padding: 3rem 2.5rem;
          text-align: center;
          overflow: hidden;
        }

        .admin-toggle-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f0f0f0;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--border-color);
          z-index: 10;
        }

        .admin-toggle-btn:hover {
          background: var(--bg-cream);
          color: var(--primary-green);
          transform: rotate(15deg) scale(1.1);
        }

        .admin-toggle-btn.active {
          background: var(--primary-green);
          color: white;
          border-color: var(--primary-green);
          box-shadow: 0 4px 12px rgba(10, 66, 38, 0.2);
        }
        
        .login-header {
          margin-bottom: 2.5rem;
        }
        
        .login-title {
          font-size: 2rem;
          color: var(--primary-green);
          margin-bottom: 0.5rem;
        }
        
        .login-subtitle {
          color: var(--text-muted);
        }
        
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
        
        .otp-container {
          text-align: center;
          margin-bottom: 1rem;
        }
        
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

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
