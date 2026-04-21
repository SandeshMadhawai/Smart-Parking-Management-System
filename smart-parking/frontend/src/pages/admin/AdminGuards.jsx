import React, { useEffect, useState } from 'react';
import { Plus, Shield, Pencil, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Layout from '../../components/shared/Layout';
import Modal from '../../components/shared/Modal';

const defaultForm = { name: '', email: '', password: '', phone: '', role: 'guard', assignedGate: '' };

export default function AdminGuards() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', role: u.role, assignedGate: u.assignedGate || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editing) {
        await api.put(`/users/${editing._id}`, payload);
        toast.success('Guard updated');
      } else {
        await api.post('/users', payload);
        toast.success('Guard created');
      }
      setModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success(user.isActive ? 'Account deactivated' : 'Account activated');
      fetch();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Guard Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage security guards and staff</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Guard
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u._id} className={`card p-5 ${!u.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    u.role === 'admin' ? 'bg-blue-100' : 'bg-amber-100'
                  }`}>
                    <Shield size={20} className={u.role === 'admin' ? 'text-blue-600' : 'text-amber-600'} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => toggleActive(u)} className={`p-1.5 rounded-lg transition-colors ${
                    u.isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'
                  }`}>
                    <Power size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Role</span>
                  <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-yellow'}`}>{u.role}</span>
                </div>
                {u.phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-gray-700">{u.phone}</span>
                  </div>
                )}
                {u.assignedGate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gate</span>
                    <span className="text-gray-700">{u.assignedGate}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="col-span-3 card p-16 text-center">
              <Shield size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No guards added yet</p>
              <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Guard</button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Guard' : 'Add Guard'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input className="input" placeholder="Ramesh Kumar" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="guard@org.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required={!editing} disabled={!!editing} />
            </div>
            <div>
              <label className="label">{editing ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input type="password" className="input" placeholder="Min 6 chars" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="9876543210" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="guard">Guard</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Assigned Gate</label>
              <input className="input" placeholder="Gate A" value={form.assignedGate}
                onChange={e => setForm({ ...form, assignedGate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create Guard'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
