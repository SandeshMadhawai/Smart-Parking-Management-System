import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import '../Auth.css';

export default function GuardLogin() {
  const navigate = useNavigate();
  const { loginGuard } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginGuard(form.email, form.password);
      toast.success('Welcome!');
      navigate('/guard/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page guard-auth-page">
      <section className="guard-auth-card">
        <Link to="/" className="auth-brand" aria-label="SpotJet home">
          <img src="/SJ_Submark_logo_light.jpeg" alt="" />
          <span>SPOTJET</span>
        </Link>

        <div className="auth-heading guard-auth-heading">
          <Shield size={18} />
          <h1>Guard Login</h1>
          <p>Security Gate Access</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="guard@org.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
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
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
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

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight size={17} />
          </button>
        </form>

        <div className="auth-demo">
          <strong>Demo:</strong> guard1@techparkmall.com / guard123
        </div>

        <Link to="/admin/login" className="auth-switch-link">Admin? Login here →</Link>
      </section>
    </main>
  );
}
