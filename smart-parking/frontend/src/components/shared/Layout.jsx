import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ParkingSquare, Car, Users, Settings,
  LogOut, Menu, X, ChevronRight, Bell, Shield
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/areas', label: 'Parking Areas', icon: ParkingSquare },
  { to: '/admin/slots', label: 'Slots', icon: Car },
  { to: '/admin/sessions', label: 'Sessions', icon: Car },
  { to: '/admin/guards', label: 'Guard Accounts', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const guardLinks = [
  { to: '/guard/dashboard', label: 'Slot Grid', icon: ParkingSquare },
  { to: '/guard/sessions', label: 'My Sessions', icon: Car },
];

export default function Layout({ children }) {
  const { user, userType, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = userType === 'organization' || user?.role === 'admin';
  const links = isAdmin ? adminLinks : guardLinks;

  const handleLogout = () => {
    logout();
    navigate(isAdmin ? '/admin/login' : '/guard/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ParkingSquare size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">ParkSmart</p>
            <p className="text-xs text-gray-500 truncate max-w-[140px]">{user?.name || 'Loading...'}</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${
          isAdmin ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {isAdmin ? <LayoutDashboard size={12} /> : <Shield size={12} />}
          {isAdmin ? 'Admin' : 'Guard'}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={active ? 'sidebar-link-active' : 'sidebar-link-inactive'}
            >
              <Icon size={17} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="sidebar-link-inactive w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-56 bg-white shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md text-gray-600">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <ParkingSquare size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">ParkSmart</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}