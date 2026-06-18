import React, { useEffect, useState, useCallback } from 'react';
import { Search, LogOut, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Layout from '../../components/shared/Layout';
import { formatDate, formatCurrency, getLiveDuration } from '../../utils/helpers';

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter, page: pagination.page, limit: 20 });
      if (search) params.set('vehicleNumber', search);
      const res = await api.get(`/sessions?${params}`);
      setSessions(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  }, [statusFilter, search, pagination.page]);

  useEffect(() => { fetch(); }, [statusFilter, search]);

  const handleCheckout = async (sessionId) => {
    const method = prompt('Payment method? (cash/card/upi/waived)', 'cash');
    if (!method) return;
    try {
      await api.put(`/sessions/${sessionId}/checkout`, { paymentMethod: method });
      toast.success('Checkout complete');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    }
  };

  const statusBadge = (status) => ({
    active: 'badge-green',
    completed: 'badge-gray',
    cancelled: 'badge-red',
  }[status] || 'badge-gray');

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">All parking sessions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-2">
          {['active', 'completed', 'all'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s === 'all' ? '' : s); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                (s === 'all' ? !statusFilter : statusFilter === s)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search vehicle number..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Vehicle', 'Driver', 'Slot', 'Entry', 'Duration', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No sessions found</td></tr>
              ) : sessions.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-gray-900">{s.vehicleNumber}</span>
                    <p className="text-xs text-gray-400 capitalize">{s.vehicleType}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{s.driverName}</p>
                    <p className="text-xs text-gray-400">{s.mobileNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono badge-blue">{s.slotNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                    {formatDate(s.entryTime)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Clock size={12} />
                      {s.status === 'active' ? getLiveDuration(s.entryTime) : `${s.actualDurationHours?.toFixed(1)}h`}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {s.status === 'active' ? '—' : formatCurrency(s.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusBadge(s.status)}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.status === 'active' && (
                      <button onClick={() => handleCheckout(s._id)}
                        className="btn-secondary btn-sm text-red-600 hover:bg-red-50 border-red-200">
                        <LogOut size={13} /> Checkout
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Total: {pagination.total}</p>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-600 px-2 py-1">{pagination.page} / {pagination.pages}</span>
              <button disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="btn-secondary btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
