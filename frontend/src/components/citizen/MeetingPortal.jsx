import React, { useState, useEffect, useRef } from 'react';
import { getMeetingRoom, sendMeetingMessage, resolveMeetingGrievance } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { playChime } from '../../services/audio';

export default function MeetingPortal({ token, onClose, onGrievanceResolved }) {
  const { currentUser, showToast } = useAuth();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Call media states
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeView, setActiveView] = useState('video'); // 'video' or 'evidence'
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Chat states
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Resolution states
  const [isResolving, setIsResolving] = useState(false);
  const [rebateAmount, setRebateAmount] = useState(340);
  const [verdictText, setVerdictText] = useState('Billed variance exceeds ±₹150 tolerance. Feeder multiplier calibration error confirmed. Full rebate approved.');
  const [resolutionResult, setResolutionResult] = useState(null);

  // Timer state
  const [callDuration, setCallDuration] = useState(0);

  // Camera video ref
  const userVideoRef = useRef(null);
  const userStreamRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Fetch meeting room metadata
  useEffect(() => {
    let mounted = true;
    getMeetingRoom(token || 'GP-50142')
      .then((data) => {
        if (mounted) {
          setRoomData(data);
          setMessages(data.messages || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching meeting room:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  // Call timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebRTC User Media Camera Stream
  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      if (isVideoOff) {
        if (userStreamRef.current) {
          userStreamRef.current.getTracks().forEach((track) => track.stop());
          userStreamRef.current = null;
        }
        return;
      }

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false // handle mic logically to prevent feedback
          });
          if (active) {
            userStreamRef.current = stream;
            if (userVideoRef.current) {
              userVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err) {
        console.warn('Camera access unavailable or declined, using dynamic virtual avatar stream:', err);
      }
    };

    startCamera();

    return () => {
      active = false;
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOff]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const toggleMic = () => {
    setIsMicMuted((prev) => !prev);
    showToast(!isMicMuted ? '🎙️ Microphone Muted' : '🎙️ Microphone Active');
  };

  const toggleVideo = () => {
    setIsVideoOff((prev) => !prev);
    showToast(!isVideoOff ? '📹 Camera Turned Off' : '📹 Camera Activated');
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      showToast('🖥️ Screen share ended');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setIsScreenSharing(true);
        showToast('🖥️ Screen sharing active: Displaying energy telemetry');
        displayStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } else {
        setIsScreenSharing(true);
        showToast('🖥️ Telemetry documentation presentation active');
      }
    } catch (err) {
      // User cancelled picker
      setIsScreenSharing(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || sendingMsg) return;

    const textToSend = chatInput.trim();
    setChatInput('');
    setSendingMsg(true);

    try {
      const res = await sendMeetingMessage(
        token || 'GP-50142',
        currentUser?.name || 'Asha Rao',
        'citizen',
        textToSend
      );

      setMessages(res.all_messages || []);
      playChime('good');
    } catch (err) {
      showToast('⚠️ Failed to send message in room');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleQuickQuestion = (text) => {
    setChatInput(text);
  };

  const handleResolveGrievance = async () => {
    try {
      const res = await resolveMeetingGrievance(
        token || 'GP-50142',
        verdictText,
        rebateAmount,
        `Resolved in virtual consultation with CSR Arbitrator ${roomData?.assigned_staff}. Adjustment rebate: ₹${rebateAmount}`
      );

      setResolutionResult(res);
      playChime('good');
      showToast(`🎉 Dispute officially settled! Settlement Code: ${res.resolution_code}`);
      if (onGrievanceResolved) onGrievanceResolved();

      // Refresh messages
      const refreshed = await getMeetingRoom(token || 'GP-50142');
      setMessages(refreshed.messages || []);
      setIsResolving(false);
    } catch (err) {
      showToast('⚠️ Error resolving grievance');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛰️</div>
          <h3>Establishing Secure WebRTC Grid Channel...</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: '13px', marginTop: '6px' }}>
            Handshaking with Urban Substation CSR Terminal ({token})
          </p>
        </div>
      </div>
    );
  }

  const assignedStaff = roomData?.assigned_staff || 'Ananya Sen';
  const csrRole = roomData?.csr_role || 'Senior Billing Specialist';
  const tele = roomData?.telemetry_snapshot || {};

  return (
    <div className="meeting-portal-overlay">
      {/* 1. Header Bar */}
      <div className="meeting-header">
        <div className="meeting-brand">
          <div className="live-indicator">
            <span className="live-dot" />
            LIVE CONSULTATION
          </div>
          <div>
            <h2 style={{ fontSize: '16.5px', margin: 0, fontWeight: 700 }}>
              Virtual Grievance Consultation Room &bull; <span className="token-tag">{token}</span>
            </h2>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '2px' }}>
              Representative: <strong>{assignedStaff}</strong> ({csrRole}) &bull; Sector: {roomData?.locality}
            </div>
          </div>
        </div>

        <div className="meeting-stats">
          <div className="stat-chip">
            ⏱️ <strong>{formatTime(callDuration)}</strong>
          </div>
          <div className="stat-chip">
            🔒 <strong>DTLS-SRTP 256-Bit Encrypted</strong>
          </div>
          <div className="stat-chip">
            ⚡ <strong>Grid Telemetry Synced</strong>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ marginLeft: '8px' }}>
            ✕ Minimize
          </button>
        </div>
      </div>

      {/* 2. Main Center Body */}
      <div className="meeting-body">
        {/* Left / Center: Video Participants & Shared Telemetry HUD */}
        <div className="meeting-stage">
          {/* View Mode Switcher */}
          <div className="stage-switch-bar">
            <button
              className={`stage-tab ${activeView === 'video' ? 'active' : ''}`}
              onClick={() => setActiveView('video')}
            >
              📹 Dual Participant Video
            </button>
            <button
              className={`stage-tab ${activeView === 'evidence' ? 'active' : ''}`}
              onClick={() => setActiveView('evidence')}
            >
              📊 Telemetry Evidence HUD &amp; Bill Audit
            </button>
          </div>

          {activeView === 'video' ? (
            <div className="video-grid">
              {/* CSR Officer Video Stream (Remote Participant) */}
              <div className="video-card csr-stream">
                <div className="stream-badge">
                  <span>🏢 {assignedStaff} (CSR Arbitrator)</span>
                  <span className="stream-badge-status">🟢 Connected</span>
                </div>

                <div className="csr-avatar-scene">
                  <div className="csr-portrait-glow">
                    <div className="csr-portrait-circle">
                      <span style={{ fontSize: '48px' }}>👩‍💼</span>
                    </div>
                    {/* Animated audio wave pulses */}
                    <div className="audio-wave-bars">
                      <span className="bar b1" />
                      <span className="bar b2" />
                      <span className="bar b3" />
                      <span className="bar b4" />
                      <span className="bar b5" />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <strong style={{ fontSize: '15px', color: '#fff' }}>{assignedStaff}</strong>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                      {csrRole} &bull; Urban Operations Command
                    </div>
                    <span className="pill pill-good" style={{ marginTop: '8px', fontSize: '10.5px' }}>
                      ● Speaking via VoLTE Substation Link
                    </span>
                  </div>
                </div>

                {/* Substation Feeder HUD Banner */}
                <div className="csr-overlay-hud">
                  <span>Grid Substation Feeder: <strong>Tech Park Phase 3 (Feeder #12B)</strong></span>
                  <span>Transformer Voltage: <strong>231.4 V (Optimal)</strong></span>
                </div>
              </div>

              {/* Citizen Consumer Video Stream (Local Participant) */}
              <div className="video-card citizen-stream">
                <div className="stream-badge">
                  <span>👤 {currentUser?.name || 'Asha Rao'} (Consumer)</span>
                  <span className="stream-badge-status">
                    {isMicMuted ? '🔴 Mic Muted' : '🟢 Mic Active'}
                  </span>
                </div>

                {/* Real Camera Video if enabled, else Avatar */}
                {!isVideoOff ? (
                  <video
                    ref={userVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="live-webcam-feed"
                  />
                ) : (
                  <div className="user-avatar-scene">
                    <div className="avatar-placeholder">
                      {currentUser?.name
                        ? currentUser.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                        : 'AR'}
                    </div>
                    <div style={{ color: '#fff', marginTop: '10px', fontSize: '14px', fontWeight: 600 }}>
                      {currentUser?.name || 'Asha Rao'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                      Smart Meter: {currentUser?.meter || 'MTR-40210'}
                    </div>
                  </div>
                )}

                <div className="local-stream-controls">
                  <span>{isMicMuted ? '🔇' : '🎙️'}</span>
                  <span>{isVideoOff ? '🚫' : '📹'}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Evidence Sharing View */
            <div className="evidence-view-card">
              <div className="section-flex" style={{ marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', color: 'var(--primary)' }}>
                    Verified Telemetry Evidence HUD — Token {token}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                    Synchronized DLMS smart-meter data stream presented to Consumer &amp; CSR
                  </div>
                </div>
                <span className="pill pill-warn">DISPUTED EVIDENCE ATTACHED</span>
              </div>

              {/* Real-time Telemetry Metrics Strip */}
              <div className="evidence-metrics-grid">
                <div className="ev-metric">
                  <span className="lbl">Active Load</span>
                  <span className="val">{tele.kw ? tele.kw.toFixed(2) : '1.35'} kW</span>
                </div>
                <div className="ev-metric">
                  <span className="lbl">RMS Voltage</span>
                  <span className="val">{tele.voltage || '230.8'} V</span>
                </div>
                <div className="ev-metric">
                  <span className="lbl">Grid Frequency</span>
                  <span className="val">{tele.frequency || '50.01'} Hz</span>
                </div>
                <div className="ev-metric">
                  <span className="lbl">Power Factor</span>
                  <span className="val">{tele.power_factor || '0.98'}</span>
                </div>
                <div className="ev-metric">
                  <span className="lbl">Today's Units</span>
                  <span className="val">{tele.today_kwh || '18.4'} kWh</span>
                </div>
              </div>

              {/* Disputed Bill Comparison Breakdown */}
              <div className="dispute-diff-box">
                <div className="diff-col billed">
                  <span className="diff-lbl">MUNICIPAL INVOICED BILL</span>
                  <span className="diff-val">₹2,180.00</span>
                  <span className="diff-sub">Feeder Charged: 240 units</span>
                </div>
                <div className="diff-vs">VS</div>
                <div className="diff-col predicted">
                  <span className="diff-lbl">AI SMART METER TELEMETRY</span>
                  <span className="diff-val">₹1,840.00</span>
                  <span className="diff-sub">Actual Metered: 185 units</span>
                </div>
                <div className="diff-col rebate">
                  <span className="diff-lbl">VARIANCE FOR REBATE</span>
                  <span className="diff-val rebate-num">+₹340.00</span>
                  <span className="diff-sub">Exceeds ±₹150 tolerance</span>
                </div>
              </div>

              <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: 'var(--ink-soft)' }}>
                <strong>Evidence Cryptographic Hash:</strong> <code>0x8f4c91b...a24e90 (Verified IEC 62056 Telemetry)</code> &bull; Both parties can agree on adjustment directly.
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Interactive Meeting Chat & Settlement Desk */}
        {isChatOpen && (
          <div className="meeting-chat-panel">
            <div className="chat-header">
              <span style={{ fontWeight: 700, fontSize: '13px' }}>💬 Consultation Notes &amp; Chat</span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => setIsResolving(!isResolving)}
              >
                {isResolving ? 'View Chat' : '⚖️ Settle Dispute'}
              </button>
            </div>

            {isResolving ? (
              /* One-Click Dispute Settlement Desk */
              <div className="settlement-desk">
                <span className="pill pill-good" style={{ marginBottom: '8px' }}>
                  OFFICIAL ARBITRATION RESOLUTION
                </span>
                <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>
                  Authorize Settlement for {token}
                </h4>

                <div className="field">
                  <label>Approved Credit Rebate (₹)</label>
                  <input
                    type="number"
                    value={rebateAmount}
                    onChange={(e) => setRebateAmount(parseFloat(e.target.value) || 0)}
                    style={{ fontWeight: 700, color: 'var(--good)', fontSize: '16px' }}
                  />
                  <small style={{ color: 'var(--ink-faint)', fontSize: '11px' }}>
                    Credit will be credited to next month's billing cycle.
                  </small>
                </div>

                <div className="field">
                  <label>Official Resolution Notes</label>
                  <textarea
                    rows={4}
                    value={verdictText}
                    onChange={(e) => setVerdictText(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>

                {resolutionResult && (
                  <div className="banner banner-good" style={{ marginTop: '10px', fontSize: '12px' }}>
                    <div>
                      <strong>✅ Resolved! Settlement Code:</strong>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px' }}>
                        {resolutionResult.resolution_code}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsResolving(false)}
                    style={{ flex: 1 }}
                  >
                    Back to Chat
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleResolveGrievance}
                    style={{ flex: 1.5 }}
                    disabled={!!resolutionResult}
                  >
                    {resolutionResult ? 'Resolved' : 'Approve & Issue Credit'}
                  </button>
                </div>
              </div>
            ) : (
              /* Live Chat Thread */
              <>
                <div className="chat-messages">
                  {messages.map((m) => {
                    const isCitizen = m.role === 'citizen';
                    const isSystem = m.role === 'system';

                    if (isSystem) {
                      return (
                        <div key={m.id} className="chat-system-msg">
                          {m.text}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`chat-bubble-row ${isCitizen ? 'citizen' : 'csr'}`}
                      >
                        <div className="chat-bubble">
                          <div className="sender-tag">
                            <strong>{m.sender}</strong>
                            <span>{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="msg-text">{m.text}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Prompts */}
                <div className="quick-prompts">
                  <button onClick={() => handleQuickQuestion("I'd like to dispute the ₹340 billing variance.")}>
                    💰 Dispute ₹340
                  </button>
                  <button onClick={() => handleQuickQuestion("Can we check the phase voltage drop logs?")}>
                    ⚡ Check Voltage Logs
                  </button>
                  <button onClick={() => handleQuickQuestion("Please approve the bill credit adjustment.")}>
                    ✅ Approve Credit
                  </button>
                </div>

                {/* Input form */}
                <form className="chat-input-row" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message to CSR officer..."
                    disabled={sendingMsg}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={sendingMsg}>
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom Control Dock */}
      <div className="meeting-dock">
        <div className="dock-left">
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
            Room: <strong>{roomData?.room_id}</strong> &bull; Token: <strong>{token}</strong>
          </span>
        </div>

        <div className="dock-center">
          <button
            className={`dock-btn ${isMicMuted ? 'muted' : ''}`}
            onClick={toggleMic}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? '🔇' : '🎙️'}
            <span className="dock-btn-label">{isMicMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            className={`dock-btn ${isVideoOff ? 'off' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? '🚫' : '📹'}
            <span className="dock-btn-label">{isVideoOff ? 'Camera On' : 'Camera Off'}</span>
          </button>

          <button
            className={`dock-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            title="Share Screen or Telemetry HUD"
          >
            🖥️
            <span className="dock-btn-label">{isScreenSharing ? 'Sharing' : 'Share Screen'}</span>
          </button>

          <button
            className={`dock-btn ${activeView === 'evidence' ? 'active' : ''}`}
            onClick={() => setActiveView(activeView === 'video' ? 'evidence' : 'video')}
            title="Toggle Smart Meter Telemetry Presentation"
          >
            📊
            <span className="dock-btn-label">Evidence HUD</span>
          </button>

          <button
            className={`dock-btn ${isChatOpen ? 'active' : ''}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
            title="Toggle Chat Drawer"
          >
            💬
            <span className="dock-btn-label">Chat</span>
          </button>

          <button
            className="dock-btn resolve"
            onClick={() => {
              setIsChatOpen(true);
              setIsResolving(true);
            }}
            title="Settle dispute and issue credit rebate"
          >
            ⚖️
            <span className="dock-btn-label">Settle Dispute</span>
          </button>
        </div>

        <div className="dock-right">
          <button className="btn btn-danger btn-sm" onClick={onClose} style={{ borderRadius: '8px', fontWeight: 700 }}>
            🔴 End Consultation
          </button>
        </div>
      </div>
    </div>
  );
}
