import React from 'react';
import { Link } from 'react-router-dom';
import { ParkingSquare, Shield, Car, BarChart3, QrCode, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ParkingSquare size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">ParkSmart</span>
        </div>
        <div className="flex gap-3">
          <Link to="/guard/login" className="btn-secondary btn-sm">Guard Login</Link>
          <Link to="/admin/login" className="btn-primary btn-sm">Admin Login</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Zap size={14} /> Smart Parking for Modern Facilities
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Manage Parking<br />
          <span className="text-blue-600">Digitally & Efficiently</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Real-time slot tracking, QR-based entry/exit, automated billing, and detailed analytics
          — all in one platform for colleges, malls, and societies.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/admin/login" className="btn-primary btn-lg px-8">
            Get Started Free
          </Link>
          <Link to="/guard/login" className="btn-secondary btn-lg px-8">
            Guard Portal
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: ParkingSquare, title: 'Real-time Slot Grid', desc: 'Visual grid showing available and occupied slots with live updates via WebSocket.', color: 'blue' },
            { icon: QrCode, title: 'QR Entry/Exit', desc: 'Auto-generate QR on vehicle entry. Owners scan to view details and pay digitally.', color: 'emerald' },
            { icon: BarChart3, title: 'Revenue Analytics', desc: 'Daily revenue charts, occupancy rates, and session history for data-driven decisions.', color: 'purple' },
            { icon: Shield, title: 'Multi-role Access', desc: 'Separate portals for admins and security guards with proper role-based permissions.', color: 'amber' },
            { icon: Car, title: 'Smart Billing', desc: 'Configurable base duration + hourly rates. Automatic calculation on checkout.', color: 'red' },
            { icon: Zap, title: 'Multi-tenant SaaS', desc: 'Each organization gets fully isolated data. Scale across multiple facilities.', color: 'indigo' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-6 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 bg-${color}-100 rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={22} className={`text-${color}-600`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 text-center py-8">
        <p className="text-gray-400 text-sm">© 2024 ParkSmart · Built with React + Node.js + MongoDB</p>
      </div>
    </div>
  );
}
