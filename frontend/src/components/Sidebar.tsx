import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Users, CreditCard, LogOut, Receipt, Shield, Settings as SettingsIcon, Palette, Sun, Moon, X, Mail, FileText, Code2, Scale, Boxes } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BillingFlowLogo } from './BillingFlowLogo';
import { VerifiedBadge } from './VerifiedBadge';

interface SidebarProps {
  onCloseMobileDrawer?: () => void;
  isDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobileDrawer, isDrawer = false }) => {
  const { user, organization, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getPlanBadge = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'growth':
        return <span className="badge badge-info" style={{ marginLeft: '8px' }}>Growth</span>;
      case 'enterprise':
        return <span className="badge badge-success" style={{ marginLeft: '8px' }}>Enterprise</span>;
      default:
        return <span className="badge badge-warning" style={{ marginLeft: '8px', color: 'var(--text-muted)', border: '1px solid var(--border-color)', background: 'transparent' }}>Free Tier</span>;
    }
  };

  const handleLinkClick = () => {
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  return (
    <aside
      className={isDrawer ? 'mobile-drawer-content' : 'sidebar'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: 1 }}>
        {/* Brand / Logo + Theme Switch */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <BillingFlowLogo size={36} subtext="Enterprise Platform" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              style={{ padding: '6px 8px', borderRadius: '50%' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
            </button>
            {isDrawer && (
              <button
                onClick={onCloseMobileDrawer}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Tenant Profile (Org) */}
        {organization && (
          <div
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization</span>
            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {organization.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Tier:</span>
              {getPlanBadge(organization.subscriptionPlan)}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavLink
            to="/"
            end
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/invoices"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FileSpreadsheet size={18} />
            <span>Invoices</span>
          </NavLink>

          <NavLink
            to="/catalog"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Boxes size={18} />
            <span>Catalog &amp; Stock</span>
          </NavLink>

          <NavLink
            to="/agreements"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Legal Agreements</span>
          </NavLink>

          <NavLink
            to="/clients"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Clients</span>
          </NavLink>

          <NavLink
            to="/settings/design"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Palette size={18} />
            <span>Bill Design</span>
          </NavLink>

          <NavLink
            to="/settings/email"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Mail size={18} />
            <span>Mail Templates</span>
          </NavLink>

          <NavLink
            to="/api-docs"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Code2 size={18} />
            <span>API &amp; Docs</span>
          </NavLink>

          <NavLink
            to="/legal"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Scale size={18} />
            <span>Legal &amp; Terms</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </NavLink>

          <NavLink
            to="/billing"
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <CreditCard size={18} />
            <span>Plan &amp; Subscriptions</span>
          </NavLink>

          {user?.role === 'superadmin' && (
            <NavLink
              to="/admin"
              onClick={handleLinkClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Shield size={18} />
              <span>Admin Control</span>
            </NavLink>
          )}
        </nav>
      </div>

      {/* User Session Info */}
      {user && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </span>
            </div>

            {user.isVerified && <VerifiedBadge size="sm" showText={false} />}
          </div>

          <button onClick={logout} className="btn btn-danger" style={{ width: '100%', padding: '9px' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};
