import React, { useState } from 'react';
import { updateAppointmentMode, simulateUpcomingAppointment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { playChime } from '../../services/audio';

export default function AppointmentsTab({ appointments, onRefreshAppointments, onJoinMeeting }) {
  const { showToast } = useAuth();
  const [updatingToken, setUpdatingToken] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const handleSwitchMode = async (token, newMode) => {
    setUpdatingToken(token);
    try {
      await updateAppointmentMode(token, newMode);
      playChime('good');
      showToast(`✅ Consultation mode updated to ${newMode.toUpperCase()}`);
      if (onRefreshAppointments) onRefreshAppointments();
    } catch (err) {
      playChime('warn');
      showToast(`⚠️ ${err.message || 'Cannot change mode'}`);
    } finally {
      setUpdatingToken(null);
    }
  };

  const handleSimulateSlot = async () => {
    setSimulating(true);
    try {
      const res = await simulateUpcomingAppointment();
      playChime('warn');
      showToast(`Simulated appointment created (${res.token}) in 2.5h! Check 4h lock state.`);
      if (onRefreshAppointments) onRefreshAppointments();
    } catch (err) {
      showToast('⚠️ Error creating simulated appointment');
    } finally {
      setSimulating(false);
    }
  };

  const primaryOnlineToken = appointments.find((a) => a.mode === 'online')?.token || appointments[0]?.token || 'GP-50142';

  return (
    <div>
      <div className="section-flex" style={{ marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>Scheduled Consultations &amp; 4-Hour Lock Rules (FR7, FR8)</h2>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            Strict SRS mandate: Mode switches are locked within 4 hours. Automated 2-hour reminders alert the citizen and CSR officer.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onJoinMeeting && onJoinMeeting(primaryOnlineToken)}
            title="Launch the virtual meeting portal for your scheduled consultation"
          >
            🎥 Open Virtual Consultation Room
          </button>
          <button
            className="btn btn-accent btn-sm"
            onClick={handleSimulateSlot}
            disabled={simulating}
            title="Create a test appointment 2.5 hours away to demonstrate the 4h lock & 2h alert"
          >
            {simulating ? 'Generating...' : '+ Simulate Slot in 2.5 Hours'}
          </button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--ink-faint)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
          <div>No pending appointments. Scheduled appointments are created automatically when raising a grievance.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {appointments.map((appt) => {
            const isLocked = appt.is_locked;
            const hoursLeft = appt.hours_until_appt;
            const isWithin2h = appt.is_within_2h_alert;

            return (
              <div
                key={appt.token}
                className="card"
                style={{
                  border: `1.5px solid ${isLocked ? 'var(--accent)' : 'var(--line)'}`
                }}
              >
                <div className="section-flex">
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700 }}>
                      {new Date(appt.appointment_at).toLocaleString([], {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '3px' }}>
                      {isLocked ? (
                        <span className="pill pill-warn">
                          🔒 Mode Locked (within 4h) &bull; Mode Switching Disabled
                        </span>
                      ) : (
                        <span className="pill pill-good">
                          🔓 Unlocked &bull; {Math.max(0, Math.round(hoursLeft))}h remaining to change mode
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="token-tag">{appt.token}</span>
                </div>

                {/* 2-Hour Advance Reminder Banner (FR8) */}
                {isWithin2h && (
                  <div className="banner banner-info" style={{ margin: '14px 0' }}>
                    <div style={{ fontSize: '20px', flexShrink: 0 }}>🔔</div>
                    <div>
                      <strong>2-Hour CSR Appointment Alert Active</strong>
                      <p style={{ marginTop: '2px', fontSize: '12.5px' }}>
                        Your support officer (<strong>{appt.assigned_staff}</strong>) has been alerted. An automated reminder dispatch has been dispatched to both citizen and utility desk.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap',
                    marginTop: '14px'
                  }}
                >
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                    Assigned Officer: <strong>{appt.assigned_staff}</strong> &bull; Urban Sector: <strong>{appt.locality}</strong>
                  </div>

                  <div className="radio-group" style={{ minWidth: '260px' }}>
                    <label
                      className={`radio-opt ${appt.mode === 'online' ? 'checked' : ''} ${
                        isLocked ? 'disabled' : ''
                      }`}
                      title={isLocked ? 'Locked within 4 hours of appointment' : 'Switch to Online Video'}
                    >
                      <input
                        type="radio"
                        name={`appt-mode-${appt.token}`}
                        value="online"
                        checked={appt.mode === 'online'}
                        disabled={isLocked || updatingToken === appt.token}
                        onChange={() => handleSwitchMode(appt.token, 'online')}
                      />
                      🌐 Online Video
                    </label>
                    <label
                      className={`radio-opt ${appt.mode === 'offline' ? 'checked' : ''} ${
                        isLocked ? 'disabled' : ''
                      }`}
                      title={isLocked ? 'Locked within 4 hours of appointment' : 'Switch to Offline Visit'}
                    >
                      <input
                        type="radio"
                        name={`appt-mode-${appt.token}`}
                        value="offline"
                        checked={appt.mode === 'offline'}
                        disabled={isLocked || updatingToken === appt.token}
                        onChange={() => handleSwitchMode(appt.token, 'offline')}
                      />
                      🏢 Offline Visit
                    </label>
                  </div>

                  {/* Direct Meeting Room Launcher */}
                  <button
                    className="btn btn-primary btn-sm"
                    style={{
                      background: appt.mode === 'online' ? 'var(--primary)' : 'var(--surface-alt)',
                      color: appt.mode === 'online' ? '#fff' : 'var(--ink)',
                      border: '1px solid var(--line)',
                      gap: '6px'
                    }}
                    onClick={() => onJoinMeeting && onJoinMeeting(appt.token)}
                    title="Launch the integrated video consultation room for this grievance"
                  >
                    🎥 {appt.mode === 'online' ? 'Join Virtual Consultation Room' : 'Test Virtual Room'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
