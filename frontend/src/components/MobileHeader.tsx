import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { VerifiedBadge } from './VerifiedBadge';
import { BillingFlowLogo } from './BillingFlowLogo';

interface MobileHeaderProps {
  onOpenDrawer: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenDrawer }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="mobile-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenDrawer}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Open Navigation Menu"
        >
          <Menu size={24} />
        </button>
        <BillingFlowLogo size={28} showText subtext="" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user?.isVerified && <VerifiedBadge size="sm" showText={false} />}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          style={{ padding: '6px 8px', borderRadius: '50%' }}
          aria-label="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>
      </div>
    </header>
  );
};
