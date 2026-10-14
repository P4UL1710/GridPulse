import React, { useState, useEffect } from 'react';
import { createComplaint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { playChime } from '../services/audio';

export default function ComplaintModal({ isOpen, onClose, initialData, onComplaintCreated }) {
  const { showToast } = useAuth();
  const [category, setCategory] = useState('Billing discrepancy');
  const [severity, setSeverity] = useState('Normal');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('offline'); // Default to offline as per FR7
  const [attachProof, setAttachProof] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.category) setCategory(initialData.category);
      if (initialData.description) setDescription(initialData.description);
      if (initialData.severity) setSeverity(initialData.severity);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('⚠️ Please provide a brief description of the issue');
      return;
    }

    setSubmitting(true);
    try {
      const newTicket = await createComplaint({
        category,
        severity,
        description: description.trim(),
        mode,
        chart_attached: attachProof
      });

      playChime('good');
      showToast(`✅ Grievance filed! Token: ${newTicket.token}`);
      if (onComplaintCreated) onComplaintCreated(newTicket);
      onClose();
    } catch (err) {
      playChime('warn');
      showToast('⚠️ Failed to register complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="section-flex" style={{ marginBottom: '16px' }}>
          <div>
            <span className="pill pill-warn">Official Grievance Channel</span>
            <h2 className="modal-title" style={{ marginTop: '4px', marginBottom: 0 }}>
              Raise Smart Energy Grievance
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>Grievance Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Billing discrepancy">Billing discrepancy</option>
                <option value="Meter reading issue">Meter reading issue</option>
                <option value="Voltage fluctuation">Voltage fluctuation</option>
                <option value="Power outage">Power outage</option>
                <option value="New connection / shifting">New connection / shifting</option>
              </select>
            </div>
            <div className="field">
              <label>Severity Level</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="Normal">Normal</option>
                <option value="High">High (Immediate Grid Dispatch)</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Preferred Consultation Mode (FR7)</label>
            <div className="radio-group">
              <label className={`radio-opt ${mode === 'offline' ? 'checked' : ''}`}>
                <input
                  type="radio"
                  name="modal-mode"
                  checked={mode === 'offline'}
                  onChange={() => setMode('offline')}
                />
                🏢 Offline Office Visit (Default)
              </label>
              <label className={`radio-opt ${mode === 'online' ? 'checked' : ''}`}>
                <input
                  type="radio"
                  name="modal-mode"
                  checked={mode === 'online'}
                  onChange={() => setMode('online')}
                />
                🌐 Online Video / Tele-Call
              </label>
            </div>
            <small style={{ color: 'var(--ink-faint)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
              *Mode can be switched later up until 4 hours before your appointment slot.
            </small>
          </div>

          <div className="field">
            <label>Description &amp; Observed Operational Pattern</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the discrepancy, voltage dip, or smart meter anomaly..."
              required
            />
          </div>

          <div style={{ margin: '14px 0', padding: '10px 12px', background: 'var(--surface-alt)', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={attachProof}
                onChange={(e) => setAttachProof(e.target.checked)}
              />
              <span>Attach verified 60-day IoT smart meter telemetry &amp; AI prediction chart as evidence</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Generating Token...' : 'Generate Official Token & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
