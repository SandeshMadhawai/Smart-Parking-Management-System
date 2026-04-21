import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Car, Clock, MapPin, IndianRupee, CheckCircle, AlertCircle,
  Calendar, User, Phone, Hash, Timer
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
  return <span className="font-mono text-2xl font-bold text-blue-600">{elapsed}</span>;
}

function LiveCharges({ session }) {
  const [charges, setCharges] = useState(session.currentCharges || {});
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const durationHours = Math.max(0, (now - new Date(session.entryTime)) / 3600000);
      const { baseDurationHours, basePrice, extraHourPrice } = session.pricing;
      let extra = 0;
      if (durationHours > baseDurationHours) {
        extra = Math.ceil(durationHours - baseDurationHours) * extraHourPrice;
      }
      setCharges({ durationHours, baseAmount: basePrice, extraAmount: extra, totalAmount: basePrice + extra });
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [session]);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between py-1">
        <span className="text-gray-500">Base charge ({session.pricing.baseDurationHours}h)</span>
        <span className="font-medium">{formatCurrency(charges.baseAmount)}</span>
      </div>
      {charges.extraAmount > 0 && (
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Extra hours</span>
          <span className="font-medium text-orange-600">+ {formatCurrency(charges.extraAmount)}</span>
        </div>
      )}
      <div className="flex justify-between py-2 border-t border-gray-100 font-bold text-base">
        <span>Total</span>
        <span className="text-blue-700">{formatCurrency(charges.totalAmount)}</span>
      </div>
    </div>
  );
}

export default function SessionView() {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [showUPI, setShowUPI] = useState(false);

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

  const handlePayAndExit = async () => {
    if (!confirm('Confirm payment and exit?')) return;
    setPaying(true);
    try {
      await api.put(`/sessions/public/${token}/checkout`);
      setPaid(true);
      fetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Loading session...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto space-y-4">

        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Car size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {session.organizationName || 'Smart Parking'}
          </h1>
          <p className="text-gray-500 text-sm">Parking Session Details</p>
        </div>

        {/* Status banner */}
        {isCompleted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-emerald-800 text-lg">Session Complete!</p>
            <p className="text-emerald-600 text-sm">Payment confirmed. Have a safe journey!</p>
          </div>
        )}

        {/* Vehicle & slot info */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Vehicle</p>
              <p className="font-mono font-bold text-2xl text-gray-900 tracking-wider">
                {session.vehicleNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Slot</p>
              <p className="font-mono font-bold text-2xl text-blue-600">{session.slotNumber}</p>
              <p className="text-xs text-gray-400">Zone {session.areaName}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User size={14} className="text-gray-400" />
              {session.driverName}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={14} className="text-gray-400" />
              {session.mobileNumber}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-gray-400" />
              Entry: {formatDate(session.entryTime)}
            </div>
            {isCompleted && session.exitTime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                Exit: {formatDate(session.exitTime)}
              </div>
            )}
          </div>
        </div>

        {/* Live timer (only for active) */}
        {isActive && (
          <div className="card p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Timer size={16} className="text-blue-500" />
              <p className="text-sm font-medium text-gray-600">Time Parked</p>
            </div>
            <LiveTimer entryTime={session.entryTime} />
            <p className="text-xs text-gray-400 mt-1">
              Expected: {session.expectedDurationHours}h · Live updating
            </p>
          </div>
        )}

        {/* Charges */}
        <div className="card p-5">
          <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <IndianRupee size={16} className="text-blue-600" />
            {isActive ? 'Estimated Charges' : 'Final Bill'}
          </p>

          {isActive ? (
            <LiveCharges session={session} />
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Base charge</span>
                <span>{formatCurrency(session.baseAmount)}</span>
              </div>
              {session.extraAmount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Extra hours</span>
                  <span className="text-orange-600">+ {formatCurrency(session.extraAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Duration</span>
                <span>{formatDuration(session.actualDurationHours)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-100 font-bold text-base">
                <span>Total Paid</span>
                <span className="text-blue-700">{formatCurrency(session.totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Pricing info */}
          <div className="mt-3 bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500">
            Rate: {formatCurrency(session.pricing.basePrice)} for {session.pricing.baseDurationHours}h,
            then {formatCurrency(session.pricing.extraHourPrice)}/hr extra
          </div>
        </div>

        {/* Payment section (active only) */}
        {isActive && (
          <div className="card p-5">
            <p className="font-semibold text-gray-900 mb-3">Pay & Exit</p>

            {!showUPI ? (
              <button
                onClick={() => setShowUPI(true)}
                className="btn-primary w-full btn-lg"
              >
                Pay via UPI & Exit
              </button>
            ) : (
              <div className="space-y-4">
                {session.organization?.upiId ? (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-3">
                        Scan to pay <strong className="text-gray-800">{formatCurrency(session.currentCharges?.totalAmount)}</strong>
                      </p>
                      <div className="bg-white border-2 border-gray-100 rounded-2xl p-3 inline-block">
                        <QRCodeSVG
                          value={`upi://pay?pa=${session.organization.upiId}&am=${session.currentCharges?.totalAmount}&tn=Parking ${session.slotNumber} ${session.vehicleNumber}`}
                          size={160}
                          level="M"
                          includeMargin
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">UPI: {session.organization.upiId}</p>
                    </div>

                    <button
                      onClick={handlePayAndExit}
                      disabled={paying}
                      className="btn-success w-full btn-lg"
                    >
                      {paying ? 'Processing...' : '✓ Confirm Payment & Exit'}
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-500 text-sm py-4">
                    <p>Pay at the exit gate.</p>
                    <p className="text-xs mt-1">UPI not configured for this facility.</p>
                  </div>
                )}

                <button
                  onClick={() => setShowUPI(false)}
                  className="btn-secondary w-full btn-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by ParkSmart · {session.organizationName}
        </p>
      </div>
    </div>
  );
}
