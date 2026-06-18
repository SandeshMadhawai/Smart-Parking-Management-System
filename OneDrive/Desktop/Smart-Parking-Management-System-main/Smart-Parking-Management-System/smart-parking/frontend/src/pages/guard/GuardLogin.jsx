import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Guard Login</h1>
          <p className="text-gray-400 text-sm mt-1">Security Gate Access</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-gray-500"
                  placeholder="guard@org.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-gray-500"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg text-xs text-gray-400">
            <strong className="text-gray-300">Demo:</strong> guard1@techparkmall.com / guard123
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link to="/admin/login" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Admin? Login here →
          </Link>
        </div>
      </div>
    </div>
  );
}
