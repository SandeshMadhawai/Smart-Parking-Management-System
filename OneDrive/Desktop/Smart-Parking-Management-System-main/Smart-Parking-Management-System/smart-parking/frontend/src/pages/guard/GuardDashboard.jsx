import React, { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Car, RefreshCw, CheckCircle, Camera, Upload, Edit3, AlertTriangle, Phone, Hash, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../../components/guard/QRScanner';
import api from '../../api/axios';
import Layout from '../../components/shared/Layout';
import Modal from '../../components/shared/Modal';
import useSocketStore from '../../store/socketStore';
import useAuthStore from '../../store/authStore';
import { formatDate, getLiveDuration, formatCurrency } from '../../utils/helpers';

// ── Camera / OCR Scan Component ───────────────────────────────────────────────
function PlateScanner({ onPlateDetected }) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const fileRef = useRef();
  const videoRef = useRef();
  const [cameraMode, setCameraMode] = useState(false);
  const [stream, setStream] = useState(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraMode(false);
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(s);
      setCameraMode(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = s;
      }, 100);
    } catch {
      toast.error('Camera access denied. Use file upload instead.');
    }
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      stopCamera();
      processImage(blob);
    }, 'image/jpeg', 0.95);
  };

  const processImage = async (blob) => {
    setScanning(true);
    setResult(null);
    setPreview(URL.createObjectURL(blob));

    const formData = new FormData();
    formData.append('image', blob, 'plate.jpg');

    try {
      const res = await api.post('/ocr/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { plate, confidence, allResults } = res.data.data;
      setResult({ plate, confidence, allResults });
      toast.success(`Plate detected: ${plate} (${confidence}% confidence)`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not read plate. Try a clearer image.';
      toast.error(msg);
      setResult(null);
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const confirmPlate = (plate) => {
    onPlateDetected(plate);
    setResult(null);
    setPreview(null);
  };

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Scan Number Plate
      </p>

      {!cameraMode && !preview && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Camera size={18} /> Live Camera
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <Upload size={18} /> Upload Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Live camera view */}
      {cameraMode && (
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-black relative">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-40 object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-yellow-400 rounded w-4/5 h-16 opacity-70" />
          </div>
          <div className="flex gap-2 p-2 bg-black">
            <button type="button" onClick={captureFromCamera}
              className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg font-medium">
              📸 Capture Plate
            </button>
            <button type="button" onClick={stopCamera}
              className="px-4 bg-gray-700 text-white text-sm py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image preview + scanning */}
      {preview && !cameraMode && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <img src={preview} alt="plate" className="w-full h-36 object-cover" />
          {scanning && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 text-sm text-blue-700">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              Reading plate number...
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-emerald-600 font-medium">Plate detected</span>
            <span className="text-xs text-emerald-500">{result.confidence}% confidence</span>
          </div>
          <div className="font-mono text-xl font-bold text-emerald-900 tracking-widest mb-2 text-center bg-white rounded-lg py-2 border border-emerald-200">
            {result.plate}
          </div>
          <button
            type="button"
            onClick={() => confirmPlate(result.plate)}
            className="w-full bg-emerald-600 text-white text-sm py-2 rounded-lg font-medium"
          >
            ✓ Use this plate number
          </button>
          {result.allResults?.length > 1 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Other possibilities:</p>
              <div className="flex gap-2 flex-wrap">
                {result.allResults.slice(1).map((r) => (
                  <button key={r.plate} type="button"
                    onClick={() => confirmPlate(r.plate)}
                    className="text-xs bg-white border border-gray-200 rounded px-2 py-1 font-mono">
                    {r.plate} ({r.confidence}%)
                  </button>
                ))}
              </div>
            </div>
          )}
          <button type="button" onClick={() => { setResult(null); setPreview(null); }}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600">
            Scan again
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [plateConfirmed, setPlateConfirmed] = useState(false);
  const [editingPlate, setEditingPlate] = useState(false);
  const [loading, setLoading] = useState(false);
  const mobileRef = useRef();

  const handlePlateDetected = (plate) => {
    setForm(f => ({ ...f, vehicleNumber: plate }));
    setPlateConfirmed(true);
    setEditingPlate(false);
    setTimeout(() => mobileRef.current?.focus(), 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleNumber) {
      toast.error('Please scan or enter a vehicle number');
      return;
    }
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
      {/* Slot info */}
      <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="font-bold text-white font-mono text-sm">{slot.slotNumber}</span>
        </div>
        <div>
          <p className="font-semibold text-blue-900 text-sm">Slot {slot.slotNumber}</p>
          <p className="text-xs text-blue-600 capitalize">{slot.vehicleType} · Available</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Show scanner if plate not confirmed yet */}
        {!plateConfirmed && (
          <PlateScanner onPlateDetected={handlePlateDetected} />
        )}

        {/* Confirmed plate display */}
        {plateConfirmed && !editingPlate && (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">Number plate (auto-scanned)</span>
              <button type="button" onClick={() => setEditingPlate(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <Edit3 size={12} /> Edit
              </button>
            </div>
            <div className="font-mono text-2xl font-bold text-gray-900 tracking-widest text-center bg-white rounded-lg py-2 border border-gray-200">
              {form.vehicleNumber}
            </div>
          </div>
        )}

        {/* Manual edit mode */}
        {(editingPlate || (!plateConfirmed && form.vehicleNumber)) && (
          <div>
            <label className="label">Vehicle Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8 uppercase font-mono tracking-wider"
                placeholder="MH12AB1234"
                value={form.vehicleNumber}
                onChange={e => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                required
              />
            </div>
            {plateConfirmed && (
              <button type="button" onClick={() => setEditingPlate(false)}
                className="text-xs text-gray-400 mt-1 hover:text-gray-600">
                ← Back to scanned plate
              </button>
            )}
          </div>
        )}

        {/* Manual entry fallback if no scan attempted */}
        {!plateConfirmed && !form.vehicleNumber && (
          <div>
            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or enter manually</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8 uppercase font-mono tracking-wider"
                placeholder="MH12AB1234"
                value={form.vehicleNumber}
                onChange={e => {
                  setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() });
                  if (e.target.value.length > 3) setPlateConfirmed(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Driver name */}
        <div>
          <label className="label">Driver Name</label>
          <input className="input" placeholder="Rahul Sharma (optional)"
            value={form.driverName}
            onChange={e => setForm({ ...form, driverName: e.target.value })} />
        </div>

        {/* Mobile - required for SMS */}
        <div>
          <label className="label">
            Mobile Number <span className="text-red-500">*</span>
            <span className="text-xs text-gray-400 font-normal ml-1">(QR will be sent here)</span>
          </label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={mobileRef}
              className="input pl-8"
              placeholder="9876543210"
              type="tel"
              maxLength={10}
              value={form.mobileNumber}
              onChange={e => setForm({ ...form, mobileNumber: e.target.value.replace(/\D/g, '') })}
              required
            />
          </div>
        </div>

        {/* Vehicle type */}
        <div>
          <label className="label">Vehicle Type</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'car', emoji: '🚗' },
              { value: 'bike', emoji: '🏍️' },
              { value: 'truck', emoji: '🚛' },
              { value: 'bus', emoji: '🚌' },
            ].map(({ value, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, vehicleType: value })}
                className={`p-2 rounded-lg border text-center text-xs transition-all ${
                  form.vehicleType === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-base mb-0.5">{emoji}</div>
                <div className="capitalize">{value}</div>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading || !form.vehicleNumber}
          className="btn-primary w-full btn-lg mt-2 disabled:opacity-50">
          {loading ? 'Starting session...' : '🚗 Start Parking Session'}
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
        <p className="text-emerald-600 text-sm">QR sent via SMS to {session.mobileNumber}</p>
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
          <span className="text-gray-500">Slot</span>
          <span className="font-mono font-bold text-blue-600">{session.slotNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Entry</span>
          <span>{formatDate(session.entryTime)}</span>
        </div>
      </div>
      <button onClick={onClose} className="btn-primary w-full">Done ✓</button>
    </div>
  );
}

// ── Slot Info Modal ───────────────────────────────────────────────────────────
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
          <p className="font-semibold text-red-900 text-sm">Slot {slot.slotNumber} — Occupied</p>
          <p className="text-xs text-red-500">Duration: {getLiveDuration(session.entryTime)}</p>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Vehicle</span>
          <span className="font-mono font-bold">{session.vehicleNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Driver</span>
          <span>{session.driverName || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Entry</span>
          <span>{formatDate(session.entryTime)}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Close</button>
        <button onClick={() => onCheckout(slot)} className="btn-danger flex-1">Manual Checkout</button>
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
  const [filter, setFilter] = useState('all');
  const [entryModal, setEntryModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);
  const [updatedSlots, setUpdatedSlots] = useState(new Set());
  const [scannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!socket) return;
    const handler = ({ slotId, status }) => {
      setSlotsByArea(prev =>
        prev.map(group => ({
          ...group,
          slots: group.slots.map(s => s._id === slotId ? { ...s, status } : s),
        }))
      );
      setUpdatedSlots(prev => new Set([...prev, slotId]));
      setTimeout(() => setUpdatedSlots(prev => {
        const next = new Set(prev); next.delete(slotId); return next;
      }), 800);
    };
    socket.on('slotUpdated', handler);
    return () => socket.off('slotUpdated', handler);
  }, [socket]);

  // Listen for plate scanned from IoT camera
  useEffect(() => {
    if (!socket) return;
    const handler = ({ plate, confidence }) => {
      toast.success(`📷 Plate scanned: ${plate} (${confidence}%)`);
    };
    socket.on('plateScanned', handler);
    return () => socket.off('plateScanned', handler);
  }, [socket]);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    if (slot.status === 'available') setEntryModal(true);
    else if (slot.status === 'occupied') setInfoModal(true);
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

  const handleQRScan = (scannedText) => {
  setScannerOpen(false);

  // Extract token from scanned URL
  // URL format: http://xxx/guard/verify/TOKEN
  // or: http://xxx/session/TOKEN
  try {
    const url = new URL(scannedText);
    const parts = url.pathname.split('/').filter(Boolean);

    // Handle both /guard/verify/:token and /session/:token
    const token = parts[parts.length - 1];

    if (token && token.length > 10) {
      toast.success('QR scanned! Loading session...');
      navigate(`/guard/verify/${token}`);
    } else {
      toast.error('Invalid QR code. Please scan the owner parking QR.');
    }
  } catch {
    // If not a valid URL, try treating it as a token directly
    if (scannedText && scannedText.length > 10) {
      navigate(`/guard/verify/${scannedText}`);
    } else {
      toast.error('Invalid QR code. Please try again.');
    }
  }
};

  const totalAvailable = slotsByArea.reduce((a, g) => a + g.slots.filter(s => s.status === 'available').length, 0);
  const totalOccupied = slotsByArea.reduce((a, g) => a + g.slots.filter(s => s.status === 'occupied').length, 0);
  const total = totalAvailable + totalOccupied;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
  <div>
    <h1 className="text-xl font-bold text-gray-900">Slot Grid</h1>
    <p className="text-sm text-gray-500 mt-0.5">
      {user?.name}{user?.assignedGate ? ` · ${user.assignedGate}` : ''}
    </p>
  </div>
  <div className="flex items-center gap-2">
    {/* QR SCAN BUTTON */}
    <button
      onClick={() => setScannerOpen(true)}
      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-semibold transition-colors"
    >
      <QrCode size={16} /> Scan Exit QR
    </button>
    <button onClick={fetchSlots} className="btn-secondary btn-sm">
      <RefreshCw size={14} /> Refresh
    </button>
  </div>
</div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total</p>
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

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Available (tap to park)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Occupied</span>
        </div>
        <div className="flex gap-1.5">
          {['all', 'available', 'occupied'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                      <span className="font-bold text-white text-lg">{area.name}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Zone {area.name}</p>
                      <p className="text-xs text-gray-500">{area.floor}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-medium">{areaAvail} free</span>
                    <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 font-medium">{areaOccup} busy</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-red-400 rounded-full transition-all duration-700"
                    style={{ width: slots.length > 0 ? `${(areaOccup / slots.length) * 100}%` : '0%' }} />
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {filtered.map(slot => {
                    const isAvail = slot.status === 'available';
                    const isOccup = slot.status === 'occupied';
                    const justUpdated = updatedSlots.has(slot._id);
                    return (
                      <button key={slot._id} onClick={() => handleSlotClick(slot)}
                        disabled={slot.status === 'maintenance'}
                        className={`relative rounded-xl border-2 p-2 text-center transition-all duration-200 select-none
                          ${justUpdated ? 'slot-just-updated' : ''}
                          ${isAvail ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-md active:scale-95 cursor-pointer'
                            : isOccup ? 'border-red-300 bg-red-50 hover:bg-red-100 cursor-pointer'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'}`}
                        title={isOccup && slot.currentSessionId
                          ? `${slot.currentSessionId.vehicleNumber} — ${getLiveDuration(slot.currentSessionId.entryTime)}`
                          : slot.slotNumber}>
                        <p className={`font-mono font-bold text-xs leading-tight ${isAvail ? 'text-emerald-800' : isOccup ? 'text-red-800' : 'text-gray-400'}`}>
                          {slot.slotNumber}
                        </p>
                        {isAvail && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mx-auto mt-1" />}
                        {isOccup && <Car size={10} className="text-red-400 mx-auto mt-1" />}
                        {isOccup && slot.currentSessionId && (
                          <p className="text-[9px] text-red-500 mt-0.5 truncate">
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
        </div>
      )}

      <Modal isOpen={entryModal} onClose={() => setEntryModal(false)}
        title={`Park at Slot ${selectedSlot?.slotNumber}`} size="md">
        {selectedSlot && (
          <EntryModal slot={selectedSlot} onClose={() => setEntryModal(false)} onSuccess={handleEntrySuccess} />
        )}
      </Modal>

      <Modal isOpen={qrModal} onClose={() => { setQrModal(false); setSessionResult(null); }}
        title="Parking Confirmed" size="sm">
        {sessionResult && (
          <QRModal session={sessionResult.data} qrUrl={sessionResult.qrUrl}
            onClose={() => { setQrModal(false); setSessionResult(null); }} />
        )}
      </Modal>

      <Modal isOpen={infoModal} onClose={() => setInfoModal(false)} title="Slot Details" size="sm">
        {selectedSlot && (
          <SlotInfoModal slot={selectedSlot} onClose={() => setInfoModal(false)} onCheckout={handleManualCheckout} />
        )}
      </Modal>
      
      {/* QR Scanner Modal */}
{scannerOpen && (
  <QRScanner
    onScan={handleQRScan}
    onClose={() => setScannerOpen(false)}
  />
)}
    </Layout>
  );
}