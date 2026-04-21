import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Car, IndianRupee, ParkingSquare, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';
import Layout from '../../components/shared/Layout';
import { formatCurrency } from '../../utils/helpers';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="stat-card">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-${color}-100`}>
      <Icon size={22} className={`text-${color}-600`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        api.get('/sessions/analytics'),
        api.get('/sessions?limit=5'),
      ]);
      setAnalytics(analyticsRes.data.data);
      setRecentSessions(sessionsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const chartData = analytics?.dailyRevenue?.map(d => ({
    date: format(new Date(d._id), 'dd MMM'),
    revenue: d.revenue,
    sessions: d.sessions,
  })) || [];

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your parking facility</p>
        </div>
        <button onClick={fetchData} className="btn-secondary btn-sm">
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Car}
          label="Active Sessions"
          value={analytics?.activeSessions ?? 0}
          sub="Currently parked"
          color="blue"
        />
        <StatCard
          icon={IndianRupee}
          label="Today's Revenue"
          value={formatCurrency(analytics?.todayRevenue)}
          sub={`Total: ${formatCurrency(analytics?.totalRevenue)}`}
          color="emerald"
        />
        <StatCard
          icon={ParkingSquare}
          label="Slot Occupancy"
          value={`${analytics?.occupancyRate ?? 0}%`}
          sub={`${analytics?.availableSlots} of ${analytics?.totalSlots} available`}
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Entries"
          value={analytics?.todaySessions ?? 0}
          sub={`Total: ${analytics?.totalSessions}`}
          color="purple"
        />
      </div>

      {/* Slot status bar */}
      {analytics && analytics.totalSlots > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-800">Slot Availability</p>
            <span className="text-sm text-gray-500">
              {analytics.availableSlots} free · {analytics.occupiedSlots} occupied
            </span>
          </div>
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-400 rounded-full transition-all duration-700"
              style={{ width: `${(analytics.occupiedSlots / analytics.totalSlots) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" />Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Occupied</span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-3">
          <p className="section-title mb-4">Revenue (Last 7 Days)</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={v => `₹${v}`} />
                <Tooltip
                  formatter={(v) => [`₹${v}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#revenueGrad)" dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div className="card p-5 lg:col-span-2">
          <p className="section-title mb-4">Recent Sessions</p>
          <div className="space-y-3">
            {recentSessions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No sessions yet</p>
            )}
            {recentSessions.map(s => (
              <div key={s._id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.vehicleNumber}</p>
                  <p className="text-xs text-gray-500 truncate">{s.driverName} · {s.slotNumber}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`badge text-xs ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {s.status}
                  </span>
                  {s.totalAmount > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(s.totalAmount)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
