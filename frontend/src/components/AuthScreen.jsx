import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const LOCALITIES = ["Sector 12", "Riverside", "Old Town", "Tech Park", "Green Hills", "Lakeview"];

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('Tech Park');
  const [meter, setMeter] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pulseD, setPulseD] = useState('M0,25 L300,25');

  // Animated pulse wave line
  useEffect(() => {
    let t = 0;
    const interval = setInterval(() => {
      t += 0.15;
      let d = 'M0,25 ';
      for (let x = 0; x <= 300; x += 10) {
        const y = 25 + Math.sin(x * 0.05 + t) * 7 * Math.sin(t * 0.3) + Math.sin(x * 0.2 + t * 2) * 2.5;
        d += `L${x},${y.toFixed(1)} `;
      }
      setPulseD(d);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Use demo@gridpulse.app / demo1234');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        locality,
        meter: meter.trim() || undefined
      });
    } catch (err) {
      setError(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCitizen = () => {
    setEmail('demo@gridpulse.app');
    setPassword('demo1234');
    setError(null);
  };

  const fillAdmin = () => {
    setEmail('admin@gridpulse.app');
    setPassword('admin');
    setError(null);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Hero Section */}
        <div className="auth-hero">
          <div>
            <div className="brand-mark">
              <svg className="brand-bolt" viewBox="0 0 24 24">
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
              </svg>
              <span>GridPulse</span>
            </div>
            <h1>Urban Smart Electricity Consumer Assistance &amp; Energy Monitoring</h1>
            <p>
              Bridging domestic IoT smart-meter telemetry and urban utility decision support with AI slab forecasting, automated discrepancy disputes, and tokenized operations.
            </p>

            <div className="auth-badges">
              <span className="auth-badge">IoT Telemetry Feed (FR2)</span>
              <span className="auth-badge">AI Slab Tariff Forecast (FR3)</span>
              <span className="auth-badge">Instant Token System (FR6)</span>
              <span className="auth-badge">4h Consultation Lock (FR8)</span>
              <span className="auth-badge">Urban Grid Analytics (FR12)</span>
            </div>
          </div>

          <div>
            <div className="auth-pulse">
              <svg viewBox="0 0 300 50">
                <path d={pulseD} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="auth-foot">
              Aligned with academic literature &amp; SRS FR1–FR14. React + FastAPI + MongoDB Full-Stack Edition.
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="auth-form">
          <div className="tabbar">
            <button
              className={tab === 'login' ? 'active' : ''}
              onClick={() => { setTab('login'); setError(null); }}
            >
              Sign in
            </button>
            <button
              className={tab === 'register' ? 'active' : ''}
              onClick={() => { setTab('register'); setError(null); }}
            >
              Register Consumer
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="field">
                <label>Email ID / Registered Mobile</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@gridpulse.app"
                  required
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign in to Portal'}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-block"
                style={{ marginTop: '10px' }}
                onClick={fillDemoCitizen}
              >
                Use Demo Citizen (Asha Rao)
              </button>

              <button
                type="button"
                className="btn btn-soft btn-block"
                style={{ marginTop: '8px' }}
                onClick={fillAdmin}
              >
                Sign in as Utility Admin
              </button>

              <div className="auth-switch">
                New consumer?{' '}
                <button type="button" onClick={() => { setTab('register'); setError(null); }}>
                  Register smart meter
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div className="field">
                <label>Consumer Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asha Rao"
                  required
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Email ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="asha@gridpulse.app"
                    required
                  />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '10px' }}>
                <div className="field">
                  <label>Urban Locality / Sector</label>
                  <select value={locality} onChange={(e) => setLocality(e.target.value)}>
                    {LOCALITIES.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Smart Meter Serial (Optional)</label>
                  <input
                    type="text"
                    value={meter}
                    onChange={(e) => setMeter(e.target.value)}
                    placeholder="Auto-generated if blank"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ marginTop: '18px' }}
                disabled={loading}
              >
                {loading ? 'Creating Record...' : 'Register & Connect Smart Meter'}
              </button>

              <div className="auth-switch">
                Already registered?{' '}
                <button type="button" onClick={() => { setTab('login'); setError(null); }}>
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
