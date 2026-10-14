import React, { useMemo, useState } from 'react';

export default function LiveMeterCard({ telemetry, onRefresh, onOpenPowerQuality }) {
  const sparkPoints = useMemo(() => {
    if (!telemetry || !telemetry.sparkline || telemetry.sparkline.length === 0) return { line: '', area: '' };
    const buffer = telemetry.sparkline;
    const w = 320;
    const h = 60;
    const max = Math.max(...buffer, 2.5);
    const min = Math.min(...buffer, 0.4);
    const range = Math.max(max - min, 0.5);
    const step = w / (buffer.length - 1);

    const pts = buffer.map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 12) - 6;
      return [x, y];
    });

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${w},${h} L0,${h} Z`;
    return { line, area };
  }, [telemetry]);

  if (!telemetry) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-faint)' }}>
          Connecting to Smart Meter Telemetry...
        </div>
      </div>
    );
  }

  const isExporting = (telemetry.grid_export_kw || 0) > 0;
  const isSolarActive = (telemetry.solar_kw || 0) > 0.05;
  const touInfo = telemetry.tou || {
    period: 'Standard Rate (1.0x)',
    rate_inr: 6.50,
    badge: 'pill-info'
  };

  return (
    <div className="card">
      <div className="section-flex" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="section-title">Smart Meter Live Telemetry</span>
            <span className={`pill ${touInfo.badge || 'pill-info'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
              🕒 {touInfo.period} &bull; ₹{touInfo.rate_inr?.toFixed(2)}/kWh
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '2px' }}>
            IEC 62056 DLMS/COSEM Bidirectional Stream &bull; Packet: {telemetry.timestamp}
          </div>
        </div>
        <span className="pill pill-good">● Live IoT Feed (3s)</span>
      </div>

      {/* Main Power Draw & Net-Metering Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', margin: '14px 0 8px' }}>
        {/* Active Gross Demand */}
        <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '10px 14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase', fontWeight: 600 }}>Home Demand</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--ink)' }}>
              {(telemetry.gross_kw || telemetry.kw)?.toFixed(2)}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)' }}>kW</span>
          </div>
        </div>

        {/* Solar Generation */}
        <div style={{ background: isSolarActive ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-subtle)', borderRadius: '10px', padding: '10px 14px', border: isSolarActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: isSolarActive ? '#d97706' : 'var(--ink-faint)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            ☀️ Solar PV Array {telemetry.solar_enabled ? '(On)' : '(Off)'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: isSolarActive ? '#d97706' : 'var(--ink)' }}>
              {(telemetry.solar_kw || 0).toFixed(2)}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: isSolarActive ? '#d97706' : 'var(--ink-soft)' }}>kW</span>
          </div>
        </div>

        {/* Net Grid Exchange */}
        <div style={{ background: isExporting ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-subtle)', borderRadius: '10px', padding: '10px 14px', border: isExporting ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: isExporting ? '#059669' : 'var(--ink-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
            {isExporting ? '🟢 Grid Exporting' : '🔌 Grid Draw'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: isExporting ? '#059669' : 'var(--accent)' }}>
              {isExporting ? `+${telemetry.grid_export_kw?.toFixed(2)}` : `${(telemetry.grid_import_kw || telemetry.kw)?.toFixed(2)}`}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)' }}>kW</span>
          </div>
        </div>
      </div>

      {/* Live animated sparkline */}
      <div className="sparkline-box">
        <svg viewBox="0 0 320 60" preserveAspectRatio="none">
          {sparkPoints.area && <path className="area" d={sparkPoints.area} />}
          {sparkPoints.line && <path d={sparkPoints.line} />}
        </svg>
      </div>

      {/* Accumulators: Net Solar & Grid kWh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '8px' }}>
        <span>Import Today: <strong>{telemetry.today_kwh} kWh</strong></span>
        {telemetry.solar_today_kwh > 0 && (
          <span style={{ color: '#d97706' }}>Solar Gen Today: <strong>{telemetry.solar_today_kwh} kWh</strong></span>
        )}
        {telemetry.export_today_kwh > 0 && (
          <span style={{ color: '#059669' }}>Export Credit: <strong>{telemetry.export_today_kwh} kWh</strong></span>
        )}
      </div>

      {/* Grid parameter & Power Quality metrics */}
      <div className="tele-grid">
        <div className="tele-metric">
          <div className="lbl">Line Voltage</div>
          <div className="val">{telemetry.voltage} V</div>
        </div>
        <div className="tele-metric">
          <div className="lbl">Current</div>
          <div className="val">{telemetry.current_amps} A</div>
        </div>
        <div className="tele-metric">
          <div className="lbl">Power Factor</div>
          <div className="val" style={{ color: telemetry.power_factor < 0.90 ? '#ef4444' : 'inherit' }}>
            {telemetry.power_factor} {telemetry.power_factor < 0.90 ? '⚠️' : '✓'}
          </div>
        </div>
        <div className="tele-metric">
          <div className="lbl">Harmonics (THD)</div>
          <div className="val" style={{ color: (telemetry.thd_pct || 2.8) > 5.0 ? '#ef4444' : 'inherit' }}>
            {telemetry.thd_pct || 2.8}%
          </div>
        </div>
      </div>

      {/* Quick diagnostic button */}
      {onOpenPowerQuality && (
        <div style={{ marginTop: '10px', textAlign: 'right' }}>
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '11px', padding: '4px 10px', height: 'auto' }}
            onClick={onOpenPowerQuality}
          >
            ⚡ Inspect Power Quality &amp; Inductive Harmonics &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
