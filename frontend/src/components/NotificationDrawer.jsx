import React from 'react';

export default function NotificationDrawer({ isOpen, onClose, notifications, onClearAll }) {
  if (!isOpen) return null;

  return (
    <div className="notif-drawer">
      <div className="notif-header">
        <span>Urban Service Notifications ({notifications.length})</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {notifications.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={onClearAll}
            >
              Clear All
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '2px 8px', fontSize: '11px' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '12.5px' }}>
            No recent alerts or notifications
          </div>
        ) : (
          notifications.map((n, idx) => (
            <div key={n.id || idx} className={`notif-item ${!n.read ? 'unread' : ''}`}>
              <div>{n.text}</div>
              <div className="time">
                {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull;{' '}
                {new Date(n.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
