import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Layout from '../../components/shared/Layout';
import useAuthStore from '../../store/authStore';

export default function AdminSettings() {
  const { user, setAuth, token } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    upiId: user?.upiId || '',
    type: user?.type || 'other',
    pricing: {
      baseDurationHours: user?.pricing?.baseDurationHours || 3,
      basePrice: user?.pricing?.basePrice || 30,
      extraHourPrice: user?.pricing?.extraHourPrice || 15,
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/org/profile', form);
      setAuth(token, res.data.data, 'organization');
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleSave}>
          {/* Org info */}
          <div className="card p-6 mb-6">
            <h2 className="section-title">Organization Info</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Organization Name</label>
                <input className="input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}>
                    {['college','mall','society','hospital','office','other'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <input className="input" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="label">UPI ID (for vehicle owner payments)</label>
                <input className="input" placeholder="yourorg@upi" value={form.upiId}
                  onChange={e => setForm({ ...form, upiId: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card p-6 mb-6">
            <h2 className="section-title">Default Pricing</h2>
            <p className="text-sm text-gray-500 mb-4">
              These apply to all areas unless overridden per-area.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Base Duration (hrs)</label>
                <input type="number" className="input" min="1" value={form.pricing.baseDurationHours}
                  onChange={e => setForm({ ...form, pricing: { ...form.pricing, baseDurationHours: +e.target.value } })} />
                <p className="text-xs text-gray-400 mt-1">Charged at base rate</p>
              </div>
              <div>
                <label className="label">Base Price (₹)</label>
                <input type="number" className="input" min="0" value={form.pricing.basePrice}
                  onChange={e => setForm({ ...form, pricing: { ...form.pricing, basePrice: +e.target.value } })} />
              </div>
              <div>
                <label className="label">Extra/hour (₹)</label>
                <input type="number" className="input" min="0" value={form.pricing.extraHourPrice}
                  onChange={e => setForm({ ...form, pricing: { ...form.pricing, extraHourPrice: +e.target.value } })} />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-medium text-blue-800 mb-1">Pricing Preview</p>
              <p className="text-sm text-blue-700">
                First {form.pricing.baseDurationHours} hours: ₹{form.pricing.basePrice} flat
                <br />
                Each additional hour: ₹{form.pricing.extraHourPrice}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Example: 5 hours = ₹{form.pricing.basePrice} + {Math.ceil(5 - form.pricing.baseDurationHours)} × ₹{form.pricing.extraHourPrice} = ₹{form.pricing.basePrice + Math.max(0, Math.ceil(5 - form.pricing.baseDurationHours)) * form.pricing.extraHourPrice}
              </p>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>

        {/* Info card */}
        <div className="card p-5 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">Account Info</p>
          <div className="space-y-1 text-sm text-gray-500">
            <p>Email: <span className="text-gray-700">{user?.email}</span></p>
            <p>Organization ID: <span className="font-mono text-xs">{user?._id}</span></p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
