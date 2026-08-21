import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Users, Settings as SettingsIcon, CreditCard } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        <LayoutDashboard size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/invoices" className={({ isActive }) => (isActive ? 'active' : '')}>
        <FileSpreadsheet size={20} />
        <span>Invoices</span>
      </NavLink>

      <NavLink to="/clients" className={({ isActive }) => (isActive ? 'active' : '')}>
        <Users size={20} />
        <span>Clients</span>
      </NavLink>

      <NavLink to="/billing" className={({ isActive }) => (isActive ? 'active' : '')}>
        <CreditCard size={20} />
        <span>Plan</span>
      </NavLink>

      <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
        <SettingsIcon size={20} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
};
