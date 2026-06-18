import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Car, Clock, Calendar, User, Phone,
  CheckCircle, AlertCircle, Timer, Shield
} from 'lucide-react';
import api from '../../api/axios';
import { formatDate, formatCurrency, formatDuration } from '../../utils/helpers';

function LiveTimer({ entryTime }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(entryTime).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h > 0 ? `${h}h ` : ''}${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [entryTime]);
  return <span className="font-mono text-3xl font-bold text-blue-600">{elapsed}</span>;
}

export default function SessionView() {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = async () => {
    try {
      const res = await api.get(`/sessions/public/${token}`);
      setSession(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Session not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your parking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const isActive = session.status === 'active';
  const isCompleted = session.status === 'completed';

  // This is the QR value guard will scan — just the session token URL
  const guardScanUrl = `${window.location.origin}/guard/verify/${token}`;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto space-y-4">

        {/* Header */}
        <div className="text-center pb-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Car size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">{session.organizationName}</h1>
          <p className="text-gray-500 text-sm">Parking Pass</p>
        </div>

        {/* Completed banner */}
        {isCompleted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-emerald-800 text-lg">Payment Complete!</p>
            <p className="text-emerald-600 text-sm">Thank you. Have a safe journey!</p>
            <p className="text-emerald-600 text-sm mt-1">
              Total paid: <strong>{formatCurrency(session.totalAmount)}</strong>
            </p>
          </div>
        )}

        {/* Vehicle + Slot */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Vehicle</p>
              <p className="font-mono font-bold text-2xl text-gray-900 tracking-wider">
                {session.vehicleNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Slot</p>
              <p className="font-mono font-bold text-2xl text-blue-600">{session.slotNumber}</p>
              <p className="text-xs text-gray-400">Zone {session.areaName}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 text-gray-600">
              <User size={13} className="text-gray-400" />
              {session.driverName || 'Driver'}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={13} className="text-gray-400" />
              {session.mobileNumber}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={13} className="text-gray-400" />
              Entry: {formatDate(session.entryTime)}
            </div>
            {isCompleted && session.exitTime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={13} className="text-gray-400" />
                Exit: {formatDate(session.exitTime)}
              </div>
            )}
          </div>
        </div>

        {/* Live timer */}
        {isActive && (
          <div className="card p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Timer size={15} className="text-blue-500" />
              <p className="text-sm font-medium text-gray-600">Time Parked</p>
            </div>
            <LiveTimer entryTime={session.entryTime} />
            <p className="text-xs text-gray-400 mt-2">Updates every second</p>
          </div>
        )}

        {/* THE MAIN PART — QR for guard to scan */}
        {isActive && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-blue-600" />
              <p className="font-semibold text-gray-900 text-sm">Show this to the guard at exit</p>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Guard will scan this QR to verify your vehicle and collect payment
            </p>

            {/* Big QR code */}
            <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 flex items-center justify-center mb-4">
              <QRCodeSVG
                value={guardScanUrl}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-600 font-medium">
                🔒 This QR is unique to your parking session
              </p>
              <p className="text-xs text-blue-500 mt-0.5">
                Valid only for {session.vehicleNumber} · Slot {session.slotNumber}
              </p>
            </div>
          </div>
        )}

        {/* Pricing info */}
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">Pricing</p>
          <p className="text-sm text-gray-600">
            First {session.pricing?.baseDurationHours}h: {formatCurrency(session.pricing?.basePrice)} flat
          </p>
          <p className="text-sm text-gray-600">
            Extra hours: {formatCurrency(session.pricing?.extraHourPrice)}/hr
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by ParkSmart · {session.organizationName}
        </p>
      </div>
    </div>
  );
}