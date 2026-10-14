import React from 'react';

export default function BillForecastCard({ forecast }) {
  if (!forecast) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-faint)' }}>
          Computing AI Slab-Based Forecast...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-flex">
        <div>
          <span className="section-title">AI Electricity Bill Prediction</span>
          <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '2px' }}>
            Multi-slab rolling regression model (FR3)
          </div>
        </div>
        <span className="pill pill-info">AI Forecast</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0 2px' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '44px',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--ink)'
          }}
        >
          ₹{Math.round(forecast.projected_bill).toLocaleString('en-IN')}
        </span>
        <span style={{ fontSize: '15px', color: 'var(--ink-soft)' }}>
          est. for {Math.round(forecast.projected_units)} units
        </span>
      </div>

      {/* Cycle Progress Bar */}
      <div style={{ margin: '14px 0 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
          <span>Billing Cycle Progress</span>
          <span style={{ fontWeight: 600 }}>
            Day {forecast.day_of_month} of {forecast.days_in_month} ({forecast.cycle_progress_pct}%)
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--surface-alt)', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${forecast.cycle_progress_pct}%`,
              height: '100%',
              background: 'var(--primary)',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Slab Breakdown Details */}
      <div style={{ marginTop: '16px', background: 'var(--surface-alt)', borderRadius: '10px', padding: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Urban Slab Tariff Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
          {forecast.slab_breakdown.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink)' }}>
              <span>{s.slab_name}: <strong>{s.units} kWh</strong></span>
              <span>₹{s.amount.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)', fontSize: '11.5px' }}>
            <span>Fixed Monthly Meter Charge:</span>
            <span>₹{forecast.fixed_charge.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)', fontSize: '11.5px' }}>
            <span>State Electricity Duty (5%):</span>
            <span>₹{forecast.duty_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
