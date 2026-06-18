import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ParkingSquare, Car, Bike } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Layout from '../../components/shared/Layout';
import Modal from '../../components/shared/Modal';

const defaultForm = {
  name: '', description: '', vehicleTypes: ['any'], floor: 'Ground Floor',
  pricing: { baseDurationHours: '', basePrice: '', extraHourPrice: '' }
};

export default function AdminAreas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    try {
      const res = await api.get('/areas');
      setAreas(res.data.data);
    } catch { toast.error('Failed to load areas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setModal(true); };
  const openEdit = (area) => {
    setEditing(area);
    setForm({
      name: area.name,
      description: area.description || '',
      vehicleTypes: area.vehicleTypes || ['any'],
      floor: area.floor || 'Ground Floor',
      pricing: {
        baseDurationHours: area.pricing?.baseDurationHours || '',
        basePrice: area.pricing?.basePrice || '',
        extraHourPrice: area.pricing?.extraHourPrice || '',
      }
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, pricing: {} };
      if (form.pricing.basePrice) payload.pricing = form.pricing;
      if (editing) {
        await api.put(`/areas/${editing._id}`, payload);
        toast.success('Area updated');
      } else {
        await api.post('/areas', payload);
        toast.success('Area created');
      }
      setModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (area) => {
    if (!confirm(`Delete area ${area.name}? All slots will be deactivated.`)) return;
    try {
      await api.delete(`/areas/${area._id}`);
      toast.success('Area deleted');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Parking Areas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage sections like A, B, C</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Area
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : areas.length === 0 ? (
        <div className="card p-16 text-center">
          <ParkingSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No parking areas yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first area to get started</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            <Plus size={16} /> Create Area
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map(area => (
            <div key={area._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{area.name}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Zone {area.name}</p>
                    <p className="text-xs text-gray-500">{area.floor}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(area)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(area)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {area.description && (
                <p className="text-sm text-gray-500 mb-4">{area.description}</p>
              )}

              {/* Slot stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Total', value: area.stats?.total || 0, color: 'gray' },
                  { label: 'Available', value: area.stats?.available || 0, color: 'emerald' },
                  { label: 'Occupied', value: area.stats?.occupied || 0, color: 'red' },
                ].map(s => (
                  <div key={s.label} className={`bg-${s.color}-50 rounded-lg p-2 text-center`}>
                    <p className={`text-lg font-bold text-${s.color}-700`}>{s.value}</p>
                    <p className={`text-xs text-${s.color}-600`}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Occupancy bar */}
              {area.stats?.total > 0 && (
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${(area.stats.occupied / area.stats.total) * 100}%` }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {area.vehicleTypes?.map(t => (
                  <span key={t} className="badge-blue text-xs">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? `Edit Area ${editing.name}` : 'Create Parking Area'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Area Name / Code <span className="text-red-500">*</span></label>
              <input className="input uppercase" placeholder="A, B, C..." maxLength={5}
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Floor</label>
              <input className="input" placeholder="Ground Floor" value={form.floor}
                onChange={e => setForm({ ...form, floor: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="Near main entrance..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Vehicle Types</label>
            <div className="flex gap-2 flex-wrap">
              {['car', 'bike', 'truck', 'bus', 'any'].map(t => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={form.vehicleTypes.includes(t)}
                    onChange={e => {
                      if (e.target.checked) setForm({ ...form, vehicleTypes: [...form.vehicleTypes, t] });
                      else setForm({ ...form, vehicleTypes: form.vehicleTypes.filter(v => v !== t) });
                    }}
                    className="rounded" />
                  <span className="text-sm text-gray-700 capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Custom Pricing (optional — overrides org defaults)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Base Hours</label>
                <input type="number" className="input" placeholder="3" min="1"
                  value={form.pricing.baseDurationHours}
                  onChange={e => setForm({ ...form, pricing: { ...form.pricing, baseDurationHours: e.target.value } })} />
              </div>
              <div>
                <label className="label">Base Price (₹)</label>
                <input type="number" className="input" placeholder="30" min="0"
                  value={form.pricing.basePrice}
                  onChange={e => setForm({ ...form, pricing: { ...form.pricing, basePrice: e.target.value } })} />
              </div>
              <div>
                <label className="label">Extra/hr (₹)</label>
                <input type="number" className="input" placeholder="15" min="0"
                  value={form.pricing.extraHourPrice}
                  onChange={e => setForm({ ...form, pricing: { ...form.pricing, extraHourPrice: e.target.value } })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Area' : 'Create Area'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
