import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import '../Auth.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginOrg } = useAuthStore();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', phone: '', address: '', type: 'other', upiId: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginOrg(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/org/register', regForm);
      const { loginOrg: login, setAuth } = useAuthStore.getState();
      setAuth(res.data.token, res.data.data, 'organization');
      toast.success('Organization registered!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page admin-auth-page">
      <section className="auth-showcase">
        <Link to="/" className="auth-brand" aria-label="SpotJet home">
          <img src="/SJ_Submark_logo_light.jpeg" alt="" />
          <span>SPOTJET</span>
        </Link>

        <div className="auth-showcase-content">
          <h1>Smart Parking<br />Made Simple</h1>
          <p>Manage your parking facility digitally. Real-time slot tracking, QR-based entry/exit, and detailed analytics.</p>
          <div className="auth-highlight-grid">
            {[
              { label: 'Real-time Slots', desc: 'Live slot status updates' },
              { label: 'QR Entry/Exit', desc: 'Contactless vehicle tracking' },
              { label: 'Analytics', desc: 'Revenue & occupancy reports' },
              { label: 'Multi-tenant', desc: 'Isolated org data' },
            ].map((f) => (
              <article key={f.label} className="auth-highlight">
                <p>{f.label}</p>
                <span>{f.desc}</span>
              </article>
            ))}
          </div>
        </div>

        <p className="auth-copyright">© {new Date().getFullYear()} SpotJet. All rights reserved.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-mobile-brand">
            <Link to="/" className="auth-brand" aria-label="SpotJet home">
              <img src="/SJ_Submark_logo_light.jpeg" alt="" />
              <span>SPOTJET</span>
            </Link>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`auth-tab ${
                tab === 'login' ? 'auth-tab-active' : ''
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`auth-tab ${
                tab === 'register' ? 'auth-tab-active' : ''
              }`}
            >
              Register Org
            </button>
          </div>

          {tab === 'login' ? (
            <>
              <div className="auth-form-heading">
                <h2>Admin Login</h2>
                <p>Sign in to your organization account</p>
              </div>
              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <div className="auth-input-wrap">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="admin@company.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="auth-input auth-input-password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="auth-password-toggle"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight size={17} />
                </button>
              </form>
              <div className="auth-demo">
                <strong>Demo:</strong> admin@techparkmall.com / admin123
              </div>
            </>
          ) : (
            <>
              <div className="auth-form-heading">
                <h2>Register Organization</h2>
                <p>Create a new parking management account</p>
              </div>
              <form onSubmit={handleRegister} className="auth-form">
                <div className="auth-register-grid">
                  <div className="auth-field auth-field-full">
                    <label className="auth-label">Organization Name</label>
                    <input className="auth-input" placeholder="Tech Park Mall" value={regForm.name}
                      onChange={e => setRegForm({ ...regForm, name: e.target.value })} required />
                  </div>
                  <div className="auth-field auth-field-full">
                    <label className="auth-label">Email</label>
                    <input type="email" className="auth-input" placeholder="admin@org.com" value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <input type="password" className="auth-input" placeholder="Min 6 chars" value={regForm.password}
                      onChange={e => setRegForm({ ...regForm, password: e.target.value })} required />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Phone</label>
                    <input className="auth-input" placeholder="9876543210" value={regForm.phone}
                      onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Type</label>
                    <select className="auth-input" value={regForm.type}
                      onChange={e => setRegForm({ ...regForm, type: e.target.value })}>
                      {['college','mall','society','hospital','office','other'].map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">UPI ID</label>
                    <input className="auth-input" placeholder="org@upi" value={regForm.upiId}
                      onChange={e => setRegForm({ ...regForm, upiId: e.target.value })} />
                  </div>
                  <div className="auth-field auth-field-full">
                    <label className="auth-label">Address</label>
                    <input className="auth-input" placeholder="Street, City" value={regForm.address}
                      onChange={e => setRegForm({ ...regForm, address: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Organization'}
                  <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}

          <Link to="/guard/login" className="auth-switch-link">Security Guard? Login here →</Link>
        </div>
      </section>
    </main>
  );
}
