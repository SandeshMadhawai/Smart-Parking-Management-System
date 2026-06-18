import React, { useEffect, useState } from 'react';
import { Clock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Layout from '../../components/shared/Layout';
import { formatDate, getLiveDuration, formatCurrency } from '../../utils/helpers';

export default function GuardSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const res = await api.get('/sessions?status=active&limit=50');
      setSessions(res.data.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); const id = setInterval(fetch, 30000); return () => clearInterval(id); }, []);

  const handleCheckout = async (sessionId) => {
    const method = prompt('Payment method? (cash/card/upi/waived)', 'cash');
    if (!method) return;
    try {
      await api.put(`/sessions/${sessionId}/checkout`, { paymentMethod: method });
      toast.success('Checkout complete');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Active Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sessions.length} vehicles currently parked</p>
        </div>
        <button onClick={fetch} className="btn-secondary btn-sm">Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">No active sessions</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sessions.map(s => (
            <div key={s._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono font-bold text-lg text-gray-900">{s.vehicleNumber}</p>
                  <p className="text-sm text-gray-600">{s.driverName}</p>
                  <p className="text-xs text-gray-400">{s.mobileNumber}</p>
                </div>
                <span className="badge-blue font-mono text-sm">{s.slotNumber}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {formatDate(s.entryTime)}
                </span>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="font-semibold text-gray-900">{getLiveDuration(s.entryTime)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Expected</p>
                  <p className="font-semibold text-gray-900">{s.expectedDurationHours}h</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Base rate</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(s.pricing?.basePrice)}</p>
                </div>
              </div>

              <button
                onClick={() => handleCheckout(s._id)}
                className="btn-danger w-full btn-sm"
              >
                <LogOut size={13} /> Manual Checkout
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
