import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, User, ShieldCheck, ArrowRight, Loader2, UserCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const SignupPage = () => {
  const [step, setStep] = useState(1); // 1: Details, 2: Phone OTP (only for phone)
  const [authMethod, setAuthMethod] = useState('email'); // 'phone' or 'email'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', role: 'User' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMethod === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({
          phone: formData.phone,
          options: {
            data: {
              full_name: formData.name,
              role: formData.role.toLowerCase()
            }
          }
        });
        if (error) throw error;
        setStep(2);
      } else {
        // Email + Password Signup
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              role: formData.role.toLowerCase()
            }
          }
        });

        if (error) throw error;

        // For email, we can redirect directly if email confirmation is disabled in Supabase,
        // or show a message. Usually, for local dev/demo, we assume direct login or meta-data role check.
        const userRole = data.user?.user_metadata?.role || formData.role.toLowerCase();
        
        if (userRole === 'owner') navigate('/owner-dashboard');
        else navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes('phone provider')) {
        setError('Phone auth is not configured. Please use the Email option.');
      } else {
        setError(err.message || 'Failed to create account.');
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
      
      if (userRole === 'owner') {
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
      
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card card fade-in">
        <div className="signup-header">
          <h2 className="signup-title">Create Account</h2>
          <p className="signup-subtitle">Join the Easy Park community</p>
        </div>

        {error && (
          <div className="error-message fade-in">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form className="signup-form" onSubmit={handleSignup}>
            <div className="input-group">
              <label><UserCircle size={18} /> Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your name" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="input-group">
              <label><User size={18} /> I want to...</label>
              <div className="role-options">
                <button 
                  type="button" 
                  className={`role-btn ${formData.role === 'User' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'User'})}
                >
                  Find Parking
                </button>
                <button 
                  type="button" 
                  className={`role-btn ${formData.role === 'Owner' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'Owner'})}
                >
                  List Space
                </button>
              </div>
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
                  <label style={{marginTop: '0.5rem'}}>Create Password</label>
                  <input 
                    type="password" 
                    placeholder="Min. 6 characters" 
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
                    placeholder="+91 XXXXX XXXXX" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </>
              )}
            </div>

            <button type="submit" className="btn-primary signup-btn" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <>{authMethod === 'email' ? 'Create Account' : 'Send OTP'} <ArrowRight size={18} /></>}
            </button>
            
            <p className="auth-footer">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        ) : (
          <form className="signup-form fade-in" onSubmit={handleVerifyOtp}>
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

            <button type="submit" className="btn-primary signup-btn" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <><ShieldCheck size={18} /> Complete Registration</>}
            </button>
            <button type="button" className="resend-link" onClick={() => setStep(1)} disabled={loading}>
              Edit Details
            </button>
          </form>
        )}
      </div>

      <style jsx="true">{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-cream);
          padding: 2rem;
        }
        
        .signup-card {
          width: 100%;
          max-width: 480px;
          padding: 3rem 2.5rem;
          text-align: center;
        }
        
        .signup-header {
          margin-bottom: 2.5rem;
        }
        
        .signup-title {
          font-size: 2.25rem;
          color: var(--primary-green);
          margin-bottom: 0.5rem;
        }
        
        .signup-subtitle {
          color: var(--text-muted);
        }
        
        .signup-form {
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
          font-size: 0.95rem;
        }
        
        .input-group input {
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: #F9F9F9;
          font-size: 1rem;
          border: 1px solid var(--border-color);
          width: 100%;
          outline: none;
        }
        
        .input-group input:focus {
          border-color: var(--primary-green);
          background: white;
          box-shadow: 0 0 0 4px rgba(10, 66, 38, 0.1);
        }

        .role-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .role-btn {
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          background: white;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .role-btn.active {
          background: var(--primary-green);
          color: white;
          border-color: var(--primary-green);
        }

        .auth-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #F0F0F0;
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
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
        
        .signup-btn {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 1.1rem;
          padding: 16px;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .auth-footer a {
          color: var(--primary-green);
          font-weight: 700;
          text-decoration: none;
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

export default SignupPage
