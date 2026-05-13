import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Shield, Clock, ArrowRight, Star, Users, Phone } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav-glass">
        <div className="nav-container">
          <div className="logo-container">
            <div className="car-logo"><Car size={24} /></div>
            <span className="brand-name">Easy <span className="green-text">Park</span></span>
          </div>
          <div className="nav-links">
            <button className="btn-text" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-primary" onClick={() => navigate('/signup')}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content fade-in">
          <h1>Smart Parking, <span className="green-text">Simpler Living.</span></h1>
          <p>The premium peer-to-peer parking network. Rent out your unused space or find the perfect spot in seconds.</p>
          <div className="hero-actions">
            <button className="btn-primary lg" onClick={() => navigate('/signup?role=user')}>
              Find a Spot <ArrowRight size={20} />
            </button>
            <button className="btn-secondary lg" onClick={() => navigate('/signup?role=owner')}>
              List Your Space
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <strong>10k+</strong>
              <span>Active Users</span>
            </div>
            <div className="stat-item">
              <strong>500+</strong>
              <span>Premium Spots</span>
            </div>
            <div className="stat-item">
              <strong>4.9/5</strong>
              <span>User Rating</span>
            </div>
          </div>
        </div>
        <div className="hero-image-container">
          <img src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1200" alt="Premium Parking" className="hero-image" />
          <div className="floating-card glass">
            <div className="fc-icon"><Shield size={24} color="var(--primary-green)"/></div>
            <div>
              <strong>100% Secured</strong>
              <p>Verified listings & secure payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose Easy Park?</h2>
          <p>We've reimagined the parking experience for the modern driver and homeowner.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card card">
            <div className="f-icon"><MapPin size={32} /></div>
            <h3>Real-time Tracking</h3>
            <p>Find available spots near your destination instantly with our smart tracking system.</p>
          </div>
          <div className="feature-card card">
            <div className="f-icon"><Shield size={32} /></div>
            <h3>Owner Approval</h3>
            <p>Every booking is reviewed by the space owner to ensure security and peace of mind.</p>
          </div>
          <div className="feature-card card">
            <div className="f-icon"><Clock size={32} /></div>
            <h3>Flexible Duration</h3>
            <p>Book for an hour, a day, or a month. Our system adapts to your schedule.</p>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section glass">
        <div className="trust-content">
          <div className="trust-text">
            <h2>Trusted by Thousands</h2>
            <p>Join the community that's making urban parking efficient and profitable for everyone.</p>
            <button className="btn-primary" onClick={() => navigate('/signup')}>Join the Community</button>
          </div>
          <div className="testimonials-list">
             <div className="testi-card card">
               <div className="stars"><Star size={14} fill="#FFD700" color="#FFD700" /> 5.0</div>
               <p>"Listing my driveway has become my most consistent passive income stream. Easy Park makes it so simple."</p>
               <span className="author">- Rajesh, Property Owner</span>
             </div>
             <div className="testi-card card">
                <div className="stars"><Star size={14} fill="#FFD700" color="#FFD700" /> 5.0</div>
                <p>"Finding safe parking in the city used to be a nightmare. Now I just open the app and book a verified spot."</p>
                <span className="author">- Priya, Daily Driver</span>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-info">
            <div className="logo-container">
              <div className="car-logo"><Car size={24} /></div>
              <span className="brand-name">Easy <span className="green-text">Park</span></span>
            </div>
            <p>Revolutionizing the way we share space and park.</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <button onClick={() => navigate('/login')}>Login</button>
            <button onClick={() => navigate('/signup')}>Sign Up</button>
            <button>Contact Support</button>
          </div>
          <div className="footer-contact">
             <h4>Get in Touch</h4>
             <p><Phone size={14} /> +91 99999 00000</p>
             <p>support@easypark.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Easy Park Platform. All rights reserved.</p>
        </div>
      </footer>

      <style jsx="true">{`
        .landing-page { min-height: 100vh; background: #FDFDFD; }
        
        .nav-links { display: flex; align-items: center; gap: 1.5rem; }
        .btn-text { background: none; border: none; font-size: 1.05rem; font-weight: 600; color: var(--text-dark); cursor: pointer; transition: 0.3s; }
        .btn-text:hover { color: var(--primary-green); }
        
        .nav-glass {
          position: fixed; top: 0; left: 0; right: 0; height: 80px; 
          background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0,0,0,0.05); z-index: 1000;
          display: flex; align-items: center;
        }
        
        .nav-container {
          max-width: 1200px; margin: 0 auto; width: 100%;
          display: flex; justify-content: space-between; align-items: center; padding: 0 2rem;
        }
        
        .hero-section {
          padding: 180px 2rem 100px; max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
        }
        
        .hero-content h1 { font-size: 4rem; font-weight: 850; line-height: 1.1; margin-bottom: 1.5rem; letter-spacing: -2px; }
        .hero-content p { font-size: 1.25rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 2.5rem; max-width: 500px; }
        
        .hero-actions { display: flex; gap: 1.5rem; margin-bottom: 4rem; }
        .btn-primary.lg { padding: 18px 32px; font-size: 1.1rem; }
        .btn-secondary.lg { padding: 18px 32px; font-size: 1.1rem; background: #F1F8F4; color: var(--primary-green); border: none; }
        
        .hero-stats { display: flex; gap: 3rem; }
        .stat-item { display: flex; flex-direction: column; }
        .stat-item strong { font-size: 2rem; color: var(--primary-green); }
        .stat-item span { font-size: 0.9rem; color: var(--text-muted); font-weight: 600; }
        
        .hero-image-container { position: relative; }
        .hero-image { width: 100%; border-radius: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
        .floating-card { position: absolute; bottom: -30px; left: -40px; padding: 1.5rem 2rem; display: flex; gap: 1rem; align-items: center; width: 300px; }
        .fc-icon { width: 50px; height: 50px; border-radius: 14px; background: #E8F5E9; display: flex; align-items: center; justify-content: center; }
        .floating-card strong { display: block; font-size: 1.1rem; }
        .floating-card p { font-size: 0.8rem; color: var(--text-muted); margin: 0; }
        
        .features-section { padding: 100px 2rem; max-width: 1200px; margin: 0 auto; text-align: center; }
        .section-header { margin-bottom: 5rem; }
        .section-header h2 { font-size: 2.5rem; margin-bottom: 1rem; }
        .section-header p { color: var(--text-muted); font-size: 1.1rem; }
        
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .feature-card { padding: 3rem 2rem; text-align: left; transition: 0.3s; }
        .feature-card:hover { transform: translateY(-10px); border-color: var(--primary-green); }
        .f-icon { width: 64px; height: 64px; border-radius: 18px; background: #F1F8F4; color: var(--primary-green); display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; }
        .feature-card h3 { font-size: 1.5rem; margin-bottom: 1rem; }
        .feature-card p { color: var(--text-muted); line-height: 1.6; }
        
        .trust-section { margin: 100px 2rem; border-radius: 40px; padding: 5rem; overflow: hidden; background: linear-gradient(135deg, #0A4226 0%, #1A5F3A 100%); color: white; }
        .trust-content { display: grid; grid-template-columns: 1fr 1.5fr; gap: 4rem; align-items: center; }
        .trust-text h2 { font-size: 3rem; margin-bottom: 1.5rem; line-height: 1.1; }
        .trust-text p { font-size: 1.1rem; opacity: 0.8; margin-bottom: 2.5rem; line-height: 1.6; }
        .trust-text .btn-primary { background: white; color: var(--primary-green); padding: 16px 32px; font-weight: 800; }
        
        .testimonials-list { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .testi-card { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 2rem; }
        .stars { display: flex; gap: 4px; font-weight: 800; margin-bottom: 1rem; color: #FFD700; }
        .testi-card p { font-style: italic; opacity: 0.9; margin-bottom: 1.5rem; line-height: 1.5; }
        .author { font-weight: 700; color: white; }
        
        .landing-footer { background: #0D162B; color: white; padding: 5rem 2rem 2rem; }
        .footer-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 4rem; margin-bottom: 4rem; }
        .footer-info p { opacity: 0.6; margin-top: 1.5rem; max-width: 300px; }
        .footer-links h4, .footer-contact h4 { font-size: 1.1rem; margin-bottom: 1.5rem; }
        .footer-links button { display: block; background: none; border: none; color: white; opacity: 0.6; padding: 8px 0; font-size: 1rem; cursor: pointer; transition: 0.3s; }
        .footer-links button:hover { opacity: 1; padding-left: 5px; }
        .footer-contact p { opacity: 0.6; margin-bottom: 1rem; display: flex; align-items: center; gap: 10px; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem; text-align: center; opacity: 0.4; font-size: 0.9rem; }

        @media (max-width: 992px) {
          .hero-section { grid-template-columns: 1fr; padding-top: 140px; text-align: center; }
          .hero-content p { margin: 0 auto 2.5rem; }
          .hero-actions { justify-content: center; }
          .hero-stats { justify-content: center; }
          .floating-card { display: none; }
          .features-grid { grid-template-columns: 1fr; }
          .trust-content { grid-template-columns: 1fr; text-align: center; }
          .testimonials-list { grid-template-columns: 1fr; }
          .footer-container { grid-template-columns: 1fr; gap: 3rem; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
