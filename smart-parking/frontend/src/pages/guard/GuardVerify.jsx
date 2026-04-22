import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Car, CheckCircle, AlertCircle, Clock,
  User, Phone, IndianRupee, LogOut
} from 'lucide-react';
import api from '../../api/axios';
import { formatDate, formatCurrency, getLiveDuration } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';

function LiveCharges({ session }) {
  const [charges, setCharges] = useState({ baseAmount: 0, extraAmount: 0, totalAmount: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const durationHours = Math.max(0, (now - new Date(session.entryTime)) / 3600000);
      const { baseDurationHours, basePrice, extraHourPrice } = session.pricing;
      let extra = 0;
      if (durationHours > baseDurationHours) {
        extra = Math.ceil(durationHours - baseDurationHours) * extraHourPrice;
      }
      setCharges({
        durationHours,
        baseAmount: basePrice,
        extraAmount: extra,
        totalAmount: basePrice + extra,
      });
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [session]);

  return { charges };
}

export default function GuardVerify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { token: authToken } = useAuthStore();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [charges, setCharges] = useState({ baseAmount: 0, extraAmount: 0, totalAmount: 0 });
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const fetchSession = async () => {
    try {
      const res = await api.get(`/sessions/public/${token}`);
      const s = res.data.data;
      setSession(s);
      calculateCharges(s);
    } catch (err) {
      setError(err.response?.data?.message || 'Session not found');
    } finally {
      setLoading(false);
    }
  };

  const calculateCharges = (s) => {
    const now = new Date();
    const durationHours = Math.max(0, (now - new Date(s.entryTime)) / 3600000);
    const { baseDurationHours, basePrice, extraHourPrice } = s.pricing;
    let extra = 0;
    if (durationHours > baseDurationHours) {
      extra = Math.ceil(durationHours - baseDurationHours) * extraHourPrice;
    }
    setCharges({
      durationHours: parseFloat(durationHours.toFixed(2)),
      baseAmount: basePrice,
      extraAmount: extra,
      totalAmount: basePrice + extra,
    });
  };

  useEffect(() => {
    fetchSession();
    const id = setInterval(() => {
      if (session) calculateCharges(session);
    }, 30000);
    return () => clearInterval(id);
  }, [token]);

  const handleCheckout = async () => {
    if (!confirm(`Confirm payment of ${formatCurrency(charges.totalAmount)} collected?`)) return;
    setCheckingOut(true);
    try {
      await api.put(`/sessions/public/${token}/checkout`);
      setCheckedOut(true);
      fetchSession();
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
          <p className="text-white font-bold text-lg mb-2">Invalid QR Code</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <button onClick={() => navigate('/guard/dashboard')}
            className="mt-4 bg-amber-500 text-black px-6 py-2 rounded-lg font-medium text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = session.status === 'completed' || checkedOut;

  // UPI payment QR
  const upiString = session.organization?.upiId
    ? `upi://pay?pa=${session.organization.upiId}&am=${charges.totalAmount}&tn=Parking ${session.slotNumber} ${session.vehicleNumber}&cu=INR`
    : null;

  return (
    <div className="min-h-screen bg-gray-900 py-6 px-4">
      <div className="max-w-sm mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg">Vehicle Verified</h1>
            <p className="text-gray-400 text-xs">Guard exit verification</p>
          </div>
          <button onClick={() => navigate('/guard/dashboard')}
            className="text-gray-400 text-xs border border-gray-700 px-3 py-1.5 rounded-lg">
            ← Dashboard
          </button>
        </div>

        {/* Completed */}
        {isCompleted && (
          <div className="bg-emerald-900/40 border border-emerald-700 rounded-2xl p-4 text-center">
            <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-emerald-300 text-lg">Payment Collected!</p>
            <p className="text-emerald-500 text-sm">Session closed. Slot is now free.</p>
          </div>
        )}

        {/* Vehicle details */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vehicle</p>
              <p className="font-mono font-bold text-2xl text-white tracking-wider">
                {session.vehicleNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Slot</p>
              <p className="font-mono font-bold text-2xl text-amber-400">{session.slotNumber}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-gray-700 pt-3">
            {session.driverName && (
              <div className="flex items-center gap-2 text-gray-300">
                <User size={13} className="text-gray-500" />
                {session.driverName}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={13} className="text-gray-500" />
              {session.mobileNumber}
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock size={13} className="text-gray-500" />
              Entry: {formatDate(session.entryTime)}
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock size={13} className="text-gray-500" />
              Duration: <strong className="text-amber-400">{getLiveDuration(session.entryTime)}</strong>
            </div>
          </div>
        </div>

        {/* Bill */}
        {!isCompleted && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee size={15} className="text-amber-400" />
              <p className="font-semibold text-white text-sm">Amount to Collect</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Base charge ({session.pricing.baseDurationHours}h)</span>
                <span>{formatCurrency(charges.baseAmount)}</span>
              </div>
              {charges.extraAmount > 0 && (
                <div className="flex justify-between text-gray-300">
                  <span>Extra hours</span>
                  <span className="text-orange-400">+ {formatCurrency(charges.extraAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-700">
                <span>Total</span>
                <span className="text-amber-400">{formatCurrency(charges.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* UPI Payment QR — owner scans this */}
        {!isCompleted && upiString && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
            <p className="font-semibold text-white text-sm mb-1">
              Show UPI QR to vehicle owner
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Owner scans this with GPay / PhonePe / Paytm
            </p>

            <div className="bg-white rounded-2xl p-4 flex items-center justify-center mb-3">
              <QRCodeSVG
                value={upiString}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="text-center mb-3">
              <p className="text-gray-400 text-xs">UPI ID: {session.organization?.upiId}</p>
              <p className="text-amber-400 font-bold text-xl mt-1">
                {formatCurrency(charges.totalAmount)}
              </p>
            </div>

            {/* Confirm payment collected */}
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {checkingOut ? 'Processing...' : '✓ Payment Collected — Close Session'}
            </button>
          </div>
        )}

        {/* Cash option */}
        {!isCompleted && !upiString && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
            <p className="text-white font-semibold mb-2">Collect Cash Payment</p>
            <p className="text-amber-400 font-bold text-2xl mb-4">
              {formatCurrency(charges.totalAmount)}
            </p>
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl text-sm disabled:opacity-50"
            >
              {checkingOut ? 'Processing...' : '✓ Cash Collected — Close Session'}
            </button>
          </div>
        )}

        {/* Done button after checkout */}
        {isCompleted && (
          <button
            onClick={() => navigate('/guard/dashboard')}
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm"
          >
            ✓ Done — Back to Dashboard
          </button>
        )}

      </div>
    </div>
  );
}