import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

function Login() {
  const demoLoginLock = useRef(false);
  const [demoLoginBusy, setDemoLoginBusy] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = async (event) => {
    event.preventDefault();
    if (demoLoginLock.current) return;
    demoLoginLock.current = true;
    setDemoLoginBusy(true);
    setError('');
    try {
      const credentials = await api.get('/auth/demo-credentials');
      const demoEmail = credentials.data?.email;
      const demoPassword = credentials.data?.password;
      if (!demoEmail || !demoPassword) throw new Error('Demo credentials are unavailable');
      setEmail(demoEmail);
      setPassword(demoPassword);
      await handleSubmit(event, { email: demoEmail, password: demoPassword });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Demo login failed.');
    } finally {
      demoLoginLock.current = false;
      setDemoLoginBusy(false);
    }
  };

  const handleSubmit = async (e, demoLoginCredentials) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: (demoLoginCredentials?.email ?? email), password: (demoLoginCredentials?.password ?? password) });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">{'\u{1F3D7}'}</div>
        <h1 className="login-title">AI Safety Monitor</h1>
        <p className="login-subtitle">Construction Wearable Safety System</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Email Address</label>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          disabled={demoLoginBusy || loading}
          className="login-demo-btn"
          onClick={handleDemoLogin}
          aria-label="Log In as Demo"
        >
          {demoLoginBusy ? 'Logging In as Demo...' : 'Log In as Demo'}
        </button>

        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature-icon">{'\u{1F916}'}</span>
            AI Powered
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">{'\u{1F4E1}'}</span>
            Real-time
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">{'\u{1F6E1}'}</span>
            Secure
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">{'\u26D1'}</span>
            Safety First
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
