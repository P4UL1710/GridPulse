import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function BudgetPlannerCard({ budgetStatus, onBudgetUpdated }) {
  const { updateBudget } = useAuth();
  const [low, setLow] = useState(1200);
  const [high, setHigh] = useState(1500);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (budgetStatus) {
      setLow(budgetStatus.budget_low);
      setHigh(budgetStatus.budget_high);
    }
  }, [budgetStatus]);

  const handleSaveBudget = async () => {
    setSaving(true);
    try {
      await updateBudget(low, high);
      if (onBudgetUpdated) onBudgetUpdated();
    } finally {
      setSaving(false);
    }
  };

  if (!budgetStatus) return null;

  return (
    <div className="card">
      <div className="section-flex">
        <div>
          <span className="section-title">Budget-Based Energy Suggestions (FR4)</span>
          <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '2px' }}>
            Target consumption boundary &amp; disaggregated appliance load guidance
          </div>
        </div>
        <span className={`pill ${budgetStatus.pill_class}`}>
          {budgetStatus.status}
        </span>
      </div>

      {/* Budget Range Input */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', margin: '12px 0 16px' }}>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '4px' }}>
            Min Target (₹)
          </label>
          <input
            type="number"
            value={low}
            onChange={(e) => setLow(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '13px' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '4px' }}>
            Max Target (₹)
          </label>
          <input
            type="number"
            value={high}
            onChange={(e) => setHigh(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '13px' }}
          />
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSaveBudget} disabled={saving}>
          {saving ? 'Updating...' : 'Set Target'}
        </button>
      </div>

      {/* Prescriptive Advice List */}
      <div style={{ background: 'var(--surface-alt)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {budgetStatus.tips.map((tip, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink)' }}>
              <span style={{ color: budgetStatus.status === 'On Track' ? 'var(--good)' : 'var(--warn)', flexShrink: 0 }}>
                {budgetStatus.status === 'On Track' ? '✓' : '⚡'}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Appliance-Level Energy Disaggregation */}
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '10px', textTransform: 'uppercase' }}>
        Disaggregated Appliance Consumption Breakdown
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        {budgetStatus.appliance_breakdown.map((app, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span>{app.icon} <strong>{app.name}</strong></span>
              <span className="pill pill-neutral" style={{ fontSize: '10.5px' }}>{app.share_pct}%</span>
            </div>
            <div style={{ color: 'var(--ink-soft)', fontSize: '11.5px' }}>
              Est. {app.monthly_kwh} kWh &bull; ₹{app.monthly_cost}/mo
            </div>
            <div style={{ color: 'var(--ink-faint)', fontSize: '11px', marginTop: '4px', lineHeight: 1.35 }}>
              {app.advice}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
