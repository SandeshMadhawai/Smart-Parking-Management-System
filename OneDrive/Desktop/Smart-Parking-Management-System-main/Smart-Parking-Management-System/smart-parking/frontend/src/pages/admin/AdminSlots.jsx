import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Filter, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Layout from '../../components/shared/Layout';
import Modal from '../../components/shared/Modal';

export default function AdminSlots() {
  const [slotsByArea, setSlotsByArea] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [singleForm, setSingleForm] = useState({ areaId: '', slotNumber: '', vehicleType: 'car' });
  const [bulkForm, setBulkForm] = useState({ areaId: '', prefix: '', count: 10, vehicleType: 'car' });

  const fetch = async () => {
    try {
      const [slotsRes, areasRes] = await Promise.all([
        api.get('/slots/by-area'),
        api.get('/areas'),
      ]);
      setSlotsByArea(slotsRes.data.data);
      setAreas(areasRes.data.data);
    } catch { toast.error('Failed to load slots'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/slots', singleForm);
      toast.success('Slot created');
      setModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/slots/bulk', { ...bulkForm, count: parseInt(bulkForm.count) });
      toast.success(res.data.message);
      setBulkModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (slotId) => {
    if (!confirm('Delete this slot?')) return;
    try {
      await api.delete(`/slots/${slotId}`);
      toast.success('Slot deleted');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete occupied slot');
    }
  };

  const statusColor = (status) => ({
    available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    occupied: 'bg-red-100 text-red-700 border-red-200',
    maintenance: 'bg-gray-100 text-gray-600 border-gray-200',
    reserved: 'bg-amber-100 text-amber-700 border-amber-200',
  }[status] || 'bg-gray-100 text-gray-600');

  return (
    <Layout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Parking Slots</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage individual parking slots</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBulkModal(true)} className="btn-secondary">
            <Layers size={16} /> Bulk Add
          </button>
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus size={16} /> Add Slot
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'available', 'occupied', 'maintenance'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              filterStatus === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {slotsByArea.map(({ area, slots }) => {
            const filtered = filterStatus === 'all' ? slots : slots.filter(s => s.status === filterStatus);
            if (filtered.length === 0) return null;
            return (
              <div key={area._id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-white">{area.name}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Zone {area.name}</p>
                      <p className="text-xs text-gray-500">{filtered.length} slots shown</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="badge-green">{slots.filter(s => s.status === 'available').length} free</span>
                    <span className="badge-red">{slots.filter(s => s.status === 'occupied').length} busy</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {filtered.map(slot => (
                    <div
                      key={slot._id}
                      className={`relative group rounded-lg border p-2 text-center text-xs transition-all ${statusColor(slot.status)}`}
                    >
                      <p className="font-mono font-semibold">{slot.slotNumber}</p>
                      <p className="capitalize text-[10px] opacity-70 mt-0.5">{slot.status}</p>
                      {slot.status === 'available' && (
                        <button
                          onClick={() => handleDelete(slot._id)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single slot modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Single Slot">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Parking Area</label>
            <select className="input" value={singleForm.areaId}
              onChange={e => setSingleForm({ ...singleForm, areaId: e.target.value })} required>
              <option value="">Select area...</option>
              {areas.map(a => <option key={a._id} value={a._id}>Zone {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Slot Number</label>
            <input className="input uppercase" placeholder="A-11" value={singleForm.slotNumber}
              onChange={e => setSingleForm({ ...singleForm, slotNumber: e.target.value })} required />
          </div>
          <div>
            <label className="label">Vehicle Type</label>
            <select className="input" value={singleForm.vehicleType}
              onChange={e => setSingleForm({ ...singleForm, vehicleType: e.target.value })}>
              {['car', 'bike', 'truck', 'bus', 'any'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk slots modal */}
      <Modal isOpen={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Create Slots">
        <form onSubmit={handleBulkCreate} className="space-y-4">
          <div>
            <label className="label">Parking Area</label>
            <select className="input" value={bulkForm.areaId}
              onChange={e => setBulkForm({ ...bulkForm, areaId: e.target.value })} required>
              <option value="">Select area...</option>
              {areas.map(a => <option key={a._id} value={a._id}>Zone {a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prefix</label>
              <input className="input uppercase" placeholder="A" value={bulkForm.prefix}
                onChange={e => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                maxLength={5} />
              <p className="text-xs text-gray-400 mt-1">Slots will be: A-1, A-2... (uses area name if empty)</p>
            </div>
            <div>
              <label className="label">Count</label>
              <input type="number" className="input" placeholder="10" min="1" max="100"
                value={bulkForm.count}
                onChange={e => setBulkForm({ ...bulkForm, count: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Vehicle Type</label>
            <select className="input" value={bulkForm.vehicleType}
              onChange={e => setBulkForm({ ...bulkForm, vehicleType: e.target.value })}>
              {['car', 'bike', 'truck', 'bus', 'any'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            This will create <strong>{bulkForm.count}</strong> slots with prefix <strong>{bulkForm.prefix || 'Area name'}</strong>.
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setBulkModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating...' : `Create ${bulkForm.count} Slots`}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
