import React, { useEffect, useState } from 'react';
import { getPowerQualityDiagnostics } from '../../services/api';

export default function PowerQualityModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getPowerQualityDiagnostics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              ⚡ Grid Power Quality &amp; Harmonic Diagnostics
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '2px' }}>
              Compliant with IEEE 519-2022 &amp; Central Electricity Authority (CEA) Technical Standards
            </div>
          </div>
          <button className="btn btn-outline" style={{ padding: '4px 10px', height: 'auto' }} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-soft)' }}>
              Analyzing high-frequency sinusoidal telemetry waveforms...
            </div>
          ) : data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Primary Status Banner */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background:
                    data.pf_status === 'PENALTY_RISK'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : data.pf_status === 'MODERATE'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${
                    data.pf_status === 'PENALTY_RISK'
                      ? '#ef4444'
                      : data.pf_status === 'MODERATE'
                      ? '#f59e0b'
                      : '#10b981'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
                    Power Factor Health: {data.pf_status}
                  </span>
                  <span
                    className={`pill ${
                      data.pf_status === 'PENALTY_RISK'
                        ? 'pill-danger'
                        : data.pf_status === 'MODERATE'
                        ? 'pill-warning'
                        : 'pill-good'
                    }`}
                  >
                    PF: {data.power_factor}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '6px', lineHeight: 1.45 }}>
                  {data.action_required}
                </div>
              </div>

              {/* 4 Core Electrical Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Active Power (P)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>{data.active_power_kw} kW</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>Useful work energy</div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Reactive Power (Q)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: 'var(--accent)' }}>
                    {data.reactive_power_kvar} kVAR
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>Magnetizing load draw</div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Voltage Harmonics (THD)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: data.thd_pct > 5.0 ? '#ef4444' : '#10b981' }}>
                    {data.thd_pct}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                    {data.thd_pct <= 5.0 ? '✓ IEEE 519 Compliant (<5%)' : '⚠️ Harmonic Pollution Exceeds 5%'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Line Frequency</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>{data.frequency_hz} Hz</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>Grid synchronism nominal (50 Hz)</div>
                </div>
              </div>

              {/* APFC Capacitor Bank Recommendation */}
              <div style={{ background: 'rgba(37, 99, 235, 0.06)', borderRadius: '10px', padding: '14px 16px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#2563eb', fontSize: '13.5px' }}>
                  🔧 APFC Capacitor Bank Sizing Engine
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '6px', lineHeight: 1.5 }}>
                  {data.recommended_apfc_kvar > 0 ? (
                    <>
                      To boost your Power Factor from <strong>{data.power_factor}</strong> up to the ideal{' '}
                      <strong>0.98 lag</strong> target, we recommend connecting a shunt capacitor rated at{' '}
                      <strong style={{ color: '#2563eb' }}>{data.recommended_apfc_kvar} kVAR</strong>. This eliminates inductive heating losses and shields against DISCOM low-PF penalties.
                    </>
                  ) : (
                    <>
                      Your Power Factor is already near unity ({data.power_factor}). No capacitor bank correction is required at this time.
                    </>
                  )}
                </div>
              </div>

              {/* Harmonic Distortion Note */}
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px' }}>
                <strong>Harmonic Waveform Note:</strong> {data.thd_note}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Unable to load diagnostics</div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
