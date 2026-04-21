import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ParkingSquare, Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ParkingSquare size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">ParkSmart</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart Parking<br />Made Simple
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Manage your parking facility digitally. Real-time slot tracking, QR-based entry/exit, and detailed analytics.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Real-time Slots', desc: 'Live slot status updates' },
              { label: 'QR Entry/Exit', desc: 'Contactless vehicle tracking' },
              { label: 'Analytics', desc: 'Revenue & occupancy reports' },
              { label: 'Multi-tenant', desc: 'Isolated org data' },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-blue-200 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">© 2024 ParkSmart. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <ParkingSquare size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ParkSmart</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Register Org
            </button>
          </div>

          {tab === 'login' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
                <p className="text-gray-500 text-sm mt-1">Sign in to your organization account</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      className="input pl-9"
                      placeholder="admin@company.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input pl-9 pr-9"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                <strong>Demo:</strong> admin@techparkmall.com / admin123
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Register Organization</h2>
                <p className="text-gray-500 text-sm mt-1">Create a new parking management account</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Organization Name</label>
                    <input className="input" placeholder="Tech Park Mall" value={regForm.name}
                      onChange={e => setRegForm({ ...regForm, name: e.target.value })} required />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Email</label>
                    <input type="email" className="input" placeholder="admin@org.com" value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input type="password" className="input" placeholder="Min 6 chars" value={regForm.password}
                      onChange={e => setRegForm({ ...regForm, password: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" placeholder="9876543210" value={regForm.phone}
                      onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select className="input" value={regForm.type}
                      onChange={e => setRegForm({ ...regForm, type: e.target.value })}>
                      {['college','mall','society','hospital','office','other'].map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">UPI ID</label>
                    <input className="input" placeholder="org@upi" value={regForm.upiId}
                      onChange={e => setRegForm({ ...regForm, upiId: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Address</label>
                    <input className="input" placeholder="Street, City" value={regForm.address}
                      onChange={e => setRegForm({ ...regForm, address: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Organization'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/guard/login" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              Security Guard? Login here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
