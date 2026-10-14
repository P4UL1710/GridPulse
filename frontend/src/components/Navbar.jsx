import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  onOpenDossier,
  onToggleNotifs,
  unreadCount
}) {
  const {
    currentUser,
    currentPortal,
    setCurrentPortal,
    theme,
    toggleThemeMode,
    logout
  } = useAuth();

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'GP';

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Brand */}
        <div className="brand">
          <svg viewBox="0 0 24 24">
            <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
          </svg>
          <span>GridPulse</span>
        </div>

        {/* Portal Switcher */}
        <div className="portal-switch">
          <button
            className={currentPortal === 'customer' ? 'active' : ''}
            onClick={() => setCurrentPortal('customer')}
          >
            Citizen Portal
          </button>
          <button
            className={currentPortal === 'admin' ? 'active' : ''}
            onClick={() => setCurrentPortal('admin')}
          >
            Utility Operations (Admin)
          </button>
        </div>

        {/* Actions */}
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={onOpenDossier} title="Academic Project Dossier">
            🎓 Project Dossier
          </button>

          <button className="icon-btn" onClick={toggleThemeMode} title="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button className="icon-btn" onClick={onToggleNotifs} title="Notification Center">
            🔔
            {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
          </button>

          {/* User profile */}
          {currentUser && (
            <div className="user-badge">
              <div className="avatar">{initials}</div>
              <div>
                <strong style={{ display: 'block', fontSize: '12px', lineHeight: 1.1 }}>
                  {currentUser.name}
                </strong>
                <span style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>
                  {currentUser.locality} &bull; {currentUser.meter}
                </span>
              </div>
            </div>
          )}

          <button className="btn btn-ghost btn-sm" onClick={logout} title="Sign Out">
            Exit
          </button>
        </div>
      </div>
    </header>
  );
}
