import React, { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Car, RefreshCw, CheckCircle, X, MessageSquare, Clock, Phone, User, Hash } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/shared/Layout';
import Modal from '../../components/shared/Modal';
import useSocketStore from '../../store/socketStore';
import useAuthStore from '../../store/authStore';
import { formatDate, getLiveDuration, formatCurrency } from '../../utils/helpers';

// ── Entry Form Modal ──────────────────────────────────────────────────────────
function EntryModal({ slot, onClose, onSuccess }) {
  const [form, setForm] = useState({
    vehicleNumber: '',
    driverName: '',
    mobileNumber: '',
    vehicleType: 'car',
    expectedDurationHours: 3,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const vehicleRef = useRef();

  useEffect(() => { vehicleRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/sessions', { ...form, slotId: slot._id });
      toast.success('Session started! QR sent via SMS.');
      onSuccess(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="font-bold text-white font-mono">{slot.slotNumber}</span>
        </div>
        <div>
          <p className="font-semibold text-blue-900">Slot {slot.slotNumber}</p>
          <p className="text-xs text-blue-600 capitalize">{slot.vehicleType} · Available</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Vehicle Number <span className="text-red-500">*</span></label>
          <div className="relative">
            <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={vehicleRef}
              className="input pl-8 uppercase font-mono tracking-wider"
              placeholder="MH12AB1234"
              value={form.vehicleNumber}
              onChange={e => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Driver Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8"
                placeholder="Rahul Sharma"
                value={form.driverName}
                onChange={e => setForm({ ...form, driverName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Mobile <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8"
                placeholder="9876543210"
                type="tel"
                value={form.mobileNumber}
                onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Vehicle Type</label>
            <select className="input" value={form.vehicleType}
              onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
              {['car', 'bike', 'truck', 'bus'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Expected Duration</label>
            <div className="relative">
              <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select className="input pl-8" value={form.expectedDurationHours}
                onChange={e => setForm({ ...form, expectedDurationHours: +e.target.value })}>
                {[1, 2, 3, 4, 6, 8, 12, 24].map(h => (
                  <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <input className="input" placeholder="Any remarks..." value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-2">
          {loading ? 'Creating Session...' : '🚗 Start Parking Session'}
        </button>
      </form>
    </div>
  );
}

// ── QR Result Modal ───────────────────────────────────────────────────────────
function QRModal({ session, qrUrl, onClose }) {
  return (
    <div className="text-center space-y-5">
      <div className="bg-emerald-50 rounded-xl p-4">
        <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
        <p className="font-bold text-emerald-800 text-lg">Session Started!</p>
        <p className="text-emerald-600 text-sm">QR code sent to {session.mobileNumber}</p>
      </div>

      <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 inline-block">
        <QRCodeSVG value={qrUrl} size={180} level="M" includeMargin />
      </div>

      <div className="text-left bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Vehicle</span>
          <span className="font-mono font-bold">{session.vehicleNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Driver</span>
          <span className="font-medium">{session.driverName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Slot</span>
          <span className="font-mono font-bold text-blue-600">{session.slotNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Entry</span>
          <span>{formatDate(session.entryTime)}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Vehicle owner can scan this QR to view details and pay on exit.
      </p>

      <button onClick={onClose} className="btn-primary w-full">
        Done ✓
      </button>
    </div>
  );
}

// ── Slot Info Modal (occupied slot details) ───────────────────────────────────
function SlotInfoModal({ slot, onClose, onCheckout }) {
  const session = slot.currentSessionId;
  if (!session) return null;

  return (
    <div className="space-y-4">
      <div className="bg-red-50 rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
          <span className="font-bold text-white font-mono text-sm">{slot.slotNumber}</span>
        </div>
        <div>
          <p className="font-semibold text-red-900">Slot {slot.slotNumber} — Occupied</p>
          <p className="text-xs text-red-500">Duration: {getLiveDuration(session.entryTime)}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Vehicle</span>
          <span className="font-mono font-bold text-gray-900">{session.vehicleNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Driver</span>
          <span className="font-medium">{session.driverName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Entry Time</span>
          <span>{formatDate(session.entryTime)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Expected</span>
          <span>{session.expectedDurationHours}h</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Close</button>
        <button
          onClick={() => onCheckout(slot)}
          className="btn-danger flex-1"
        >
          Manual Checkout
        </button>
      </div>
    </div>
  );
}

// ── Main Guard Dashboard ──────────────────────────────────────────────────────
export default function GuardDashboard() {
  const { user, orgId } = useAuthStore();
  const { socket, connect } = useSocketStore();

  const [slotsByArea, setSlotsByArea] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | available | occupied

  const [entryModal, setEntryModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);
  const [updatedSlots, setUpdatedSlots] = useState(new Set());

  const fetchSlots = useCallback(async () => {
    try {
      const res = await api.get('/slots/by-area');
      setSlotsByArea(res.data.data);
    } catch { toast.error('Failed to refresh slots'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSlots();
    const id = orgId();
    if (id) connect(id.toString());
  }, []);

  // Real-time slot updates via WebSocket
  useEffect(() => {
    if (!socket) return;
    const handler = ({ slotId, status }) => {
      setSlotsByArea(prev =>
        prev.map(group => ({
          ...group,
          slots: group.slots.map(s =>
            s._id === slotId ? { ...s, status } : s
          ),
        }))
      );
      // Flash animation
      setUpdatedSlots(prev => new Set([...prev, slotId]));
      setTimeout(() => setUpdatedSlots(prev => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      }), 800);
    };
    socket.on('slotUpdated', handler);
    return () => socket.off('slotUpdated', handler);
  }, [socket]);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    if (slot.status === 'available') {
      setEntryModal(true);
    } else if (slot.status === 'occupied') {
      setInfoModal(true);
    }
  };

  const handleEntrySuccess = (data) => {
    setEntryModal(false);
    setSessionResult(data);
    setQrModal(true);
    fetchSlots();
  };

  const handleManualCheckout = async (slot) => {
    const session = slot.currentSessionId;
    if (!session) return;
    const method = prompt('Payment method? (cash/card/upi/waived)', 'cash');
    if (!method) return;
    try {
      await api.put(`/sessions/${session._id}/checkout`, { paymentMethod: method });
      toast.success('Checkout complete');
      setInfoModal(false);
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  // Summary counts
  const totalAvailable = slotsByArea.reduce((acc, g) => acc + g.slots.filter(s => s.status === 'available').length, 0);
  const totalOccupied = slotsByArea.reduce((acc, g) => acc + g.slots.filter(s => s.status === 'occupied').length, 0);
  const total = totalAvailable + totalOccupied;

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Slot Grid</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.name} {user?.assignedGate ? `· ${user.assignedGate}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchSlots} className="btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Slots</p>
        </div>
        <div className="card p-3 text-center border-emerald-200 bg-emerald-50">
          <p className="text-2xl font-bold text-emerald-600">{totalAvailable}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Available</p>
        </div>
        <div className="card p-3 text-center border-red-200 bg-red-50">
          <p className="text-2xl font-bold text-red-600">{totalOccupied}</p>
          <p className="text-xs text-red-600 mt-0.5">Occupied</p>
        </div>
      </div>

      {/* Legend + filter */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Available (tap to park)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-400 inline-block" /> Occupied (tap for details)
          </span>
        </div>
        <div className="flex gap-1.5">
          {['all', 'available', 'occupied'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Slot grid by area */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {slotsByArea.map(({ area, slots }) => {
            const filtered = filter === 'all' ? slots : slots.filter(s => s.status === filter);
            if (filtered.length === 0) return null;

            const areaAvail = slots.filter(s => s.status === 'available').length;
            const areaOccup = slots.filter(s => s.status === 'occupied').length;

            return (
              <div key={area._id} className="card p-4">
                {/* Area header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                      <span className="font-bold text-white text-lg">{area.name}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Zone {area.name}</p>
                      <p className="text-xs text-gray-500">{area.floor} · {area.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
                      {areaAvail} free
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 font-medium">
                      {areaOccup} busy
                    </span>
                  </div>
                </div>

                {/* Occupancy strip */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-red-400 rounded-full transition-all duration-700"
                    style={{ width: slots.length > 0 ? `${(areaOccup / slots.length) * 100}%` : '0%' }}
                  />
                </div>

                {/* Slot boxes */}
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {filtered.map(slot => {
                    const isAvailable = slot.status === 'available';
                    const isOccupied = slot.status === 'occupied';
                    const isMaint = slot.status === 'maintenance';
                    const justUpdated = updatedSlots.has(slot._id);

                    return (
                      <button
                        key={slot._id}
                        onClick={() => handleSlotClick(slot)}
                        disabled={isMaint}
                        className={`
                          relative rounded-xl border-2 p-2 text-center transition-all duration-200 select-none
                          ${justUpdated ? 'slot-just-updated' : ''}
                          ${isAvailable
                            ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-md active:scale-95 cursor-pointer'
                            : isOccupied
                            ? 'border-red-300 bg-red-50 hover:bg-red-100 cursor-pointer'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                          }
                        `}
                        title={isOccupied && slot.currentSessionId
                          ? `${slot.currentSessionId.vehicleNumber} — ${getLiveDuration(slot.currentSessionId.entryTime)}`
                          : slot.slotNumber
                        }
                      >
                        <p className={`font-mono font-bold text-xs leading-tight ${
                          isAvailable ? 'text-emerald-800' : isOccupied ? 'text-red-800' : 'text-gray-400'
                        }`}>
                          {slot.slotNumber}
                        </p>

                        {isAvailable && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mx-auto mt-1" />
                        )}

                        {isOccupied && (
                          <Car size={10} className="text-red-400 mx-auto mt-1" />
                        )}

                        {isOccupied && slot.currentSessionId && (
                          <p className="text-[9px] text-red-500 mt-0.5 truncate leading-tight">
                            {getLiveDuration(slot.currentSessionId.entryTime)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {slotsByArea.length === 0 && (
            <div className="card p-16 text-center">
              <Car size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No parking areas configured</p>
              <p className="text-gray-400 text-sm mt-1">Ask your admin to set up areas and slots</p>
            </div>
          )}
        </div>
      )}

      {/* Entry Modal */}
      <Modal
        isOpen={entryModal}
        onClose={() => setEntryModal(false)}
        title={`Park at Slot ${selectedSlot?.slotNumber}`}
        size="md"
      >
        {selectedSlot && (
          <EntryModal
            slot={selectedSlot}
            onClose={() => setEntryModal(false)}
            onSuccess={handleEntrySuccess}
          />
        )}
      </Modal>

      {/* QR Modal */}
      <Modal
        isOpen={qrModal}
        onClose={() => { setQrModal(false); setSessionResult(null); }}
        title="Parking Confirmed"
        size="sm"
      >
        {sessionResult && (
          <QRModal
            session={sessionResult.data}
            qrUrl={sessionResult.qrUrl}
            onClose={() => { setQrModal(false); setSessionResult(null); }}
          />
        )}
      </Modal>

      {/* Slot Info Modal */}
      <Modal
        isOpen={infoModal}
        onClose={() => setInfoModal(false)}
        title="Occupied Slot Details"
        size="sm"
      >
        {selectedSlot && (
          <SlotInfoModal
            slot={selectedSlot}
            onClose={() => setInfoModal(false)}
            onCheckout={handleManualCheckout}
          />
        )}
      </Modal>
    </Layout>
  );
}
