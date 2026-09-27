import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CarFront, ParkingSquare, QrCode, Shield, ShieldCheck, Zap } from 'lucide-react';
import './Home.css';

const features = [
  { icon: ParkingSquare, title: 'Real-time Slot Grid', description: 'Visual grid showing available and occupied slots with live updates via WebSocket.' },
  { icon: QrCode, title: 'QR Entry/Exit', description: 'Auto-generate QR on vehicle entry. Owners scan to view details and pay digitally.' },
  { icon: BarChart3, title: 'Revenue Analytics', description: 'Daily revenue charts, occupancy rates, and session history for data-driven decisions.' },
  { icon: Shield, title: 'Multi-role Access', description: 'Separate portals for admins and security guards with proper role-based permissions.' },
  { icon: CarFront, title: 'Smart Billing', description: 'Configurable base duration + hourly rates. Automatic calculation on checkout.' },
  { icon: Zap, title: 'Multi-tenant SaaS', description: 'Each organization gets fully isolated data. Scale across multiple facilities.' },
];

export default function Home() {
  return (
    <main className="home-page">
      <header className="home-header">
        <Link to="/" className="home-brand" aria-label="SpotJet home">
          <img src="/SJ_Submark_logo_light.jpeg" alt="" />
          <span>SPOTJET</span>
        </Link>
        <div className="home-nav-actions">
          <Link to="/guard/login" className="home-nav-link">Guard Login</Link>
          <Link to="/admin/login" className="home-nav-cta">Admin Login <ArrowRight size={15} /></Link>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker"><Zap size={14} /> Smart Parking for Modern Facilities</p>
          <h1>Manage Parking<br /><span>Digitally &amp; Efficiently</span></h1>
          <div className="home-hero-bottom">
            <p>Real-time slot tracking, QR-based entry/exit, automated billing, and detailed analytics — all in one platform for colleges, malls, and societies.</p>
            <div className="home-hero-actions">
              <Link to="/admin/login" className="home-button home-button-dark">Get Started Free <ArrowRight size={17} /></Link>
              <Link to="/guard/login" className="home-button home-button-outline">Guard Portal</Link>
            </div>
          </div>
        </div>
        <div className="home-hero-visual">
          <img
            src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1400&q=85"
            alt="Aerial view of a busy parking lot"
          />
          <div className="home-image-shade" />
        </div>
      </section>

      <section className="home-intro">
        <div className="home-feature-list">
          {features.map(({ icon: Icon, title, description }) => (
            <article className="home-feature" key={title}>
              <div className="home-feature-top"><Icon size={21} strokeWidth={1.7} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div className="home-cta-mark"><ShieldCheck size={20} /> BUILT FOR YOUR WHOLE TEAM</div>
        <div className="home-cta-row">
          <h2>READY TO<br />CLEAR THE WAY?</h2>
          <div className="home-cta-action">
            <p>Bring your parking operation into focus with SpotJet.</p>
            <Link to="/admin/login" className="home-button home-button-light">START WITH SPOTJET <ArrowRight size={17} /></Link>
          </div>
        </div>
        <div className="home-cta-outline">SPOTJET</div>
      </section>

      <footer className="home-footer">
        <span>© 2026 SpotJet · All rights reserved</span>
      </footer>
    </main>
  );
}
