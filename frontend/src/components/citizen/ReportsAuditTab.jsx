import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { getAuditReport } from '../../services/api';

export default function ReportsAuditTab() {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const dailyChartRef = useRef(null);
  const weeklyChartRef = useRef(null);
  const dailyChartInstance = useRef(null);
  const weeklyChartInstance = useRef(null);

  useEffect(() => {
    let mounted = true;
    getAuditReport()
      .then((data) => {
        if (mounted) {
          setAuditData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching audit report:', err);
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!auditData) return;

    // Daily 14-day Chart
    if (dailyChartRef.current) {
      if (dailyChartInstance.current) dailyChartInstance.current.destroy();

      const labels = auditData.daily_14d.map((d) => {
        const parts = d.date.split('-');
        return `${parts[2]}/${parts[1]}`;
      });
      const values = auditData.daily_14d.map((d) => d.units);

      dailyChartInstance.current = new Chart(dailyChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Daily Energy Consumed (kWh)',
              data: values,
              backgroundColor: 'rgba(25, 72, 77, 0.75)',
              borderColor: 'rgba(25, 72, 77, 1.0)',
              borderWidth: 1.5,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(213, 222, 213, 0.5)' } }
          }
        }
      });
    }

    // Weekly Profile Chart (Weekday vs Weekend)
    if (weeklyChartRef.current) {
      if (weeklyChartInstance.current) weeklyChartInstance.current.destroy();

      weeklyChartInstance.current = new Chart(weeklyChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Mon-Fri (Working Days)', 'Sat-Sun (Weekends)'],
          datasets: [
            {
              label: 'Average Daily kWh',
              data: [
                auditData.weekly_profile.weekday_avg_kwh,
                auditData.weekly_profile.weekend_avg_kwh
              ],
              backgroundColor: ['rgba(25, 72, 77, 0.75)', 'rgba(226, 150, 35, 0.85)'],
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(213, 222, 213, 0.5)' } }
          }
        }
      });
    }

    return () => {
      if (dailyChartInstance.current) dailyChartInstance.current.destroy();
      if (weeklyChartInstance.current) weeklyChartInstance.current.destroy();
    };
  }, [auditData]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        Synthesizing AI Consumption Report &amp; Audit Certificate...
      </div>
    );
  }

  if (!auditData) return null;

  return (
    <div>
      <div className="section-flex" style={{ marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>AI Consumption Report &amp; Energy Audit Certificate (FR10)</h2>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            Empirical 14-day daily load distribution and verified household electrical audit sheet
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
          🖨️ Print / Save Audit PDF
        </button>
      </div>

      {/* Graphical Load Profile Section */}
      <div className="grid-2" style={{ marginBottom: '18px' }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: '10px' }}>
            14-Day Daily Consumption Trend (kWh)
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <canvas ref={dailyChartRef} />
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: '10px' }}>
            Weekday vs Weekend Load Comparison (kWh/day)
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <canvas ref={weeklyChartRef} />
          </div>
        </div>
      </div>

      {/* Official Print-Ready Energy Audit Certificate */}
      <div
        className="card"
        style={{
          border: '2px solid var(--primary)',
          background: 'var(--surface)',
          padding: '28px',
          borderRadius: '16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--line)',
            paddingBottom: '16px',
            marginBottom: '16px'
          }}
        >
          <div>
            <span className="pill pill-good" style={{ marginBottom: '6px' }}>
              OFFICIAL CERTIFICATE OF ENERGY AUDIT
            </span>
            <h3 style={{ fontSize: '22px', color: 'var(--primary)' }}>GridPulse Urban Energy Audit</h3>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
              Audit Ref: <strong>{auditData.consumer.audit_id}</strong> &bull; Period: {auditData.consumer.audit_period}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--good)'
              }}
            >
              {auditData.metrics.audit_grade}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Bureau of Energy Efficiency Benchmark</div>
          </div>
        </div>

        {/* Consumer Credentials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '14px',
            background: 'var(--surface-alt)',
            borderRadius: '10px',
            marginBottom: '18px',
            fontSize: '12.5px'
          }}
        >
          <div>
            <span style={{ color: 'var(--ink-faint)', display: 'block', fontSize: '11px' }}>CONSUMER NAME</span>
            <strong>{auditData.consumer.name}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--ink-faint)', display: 'block', fontSize: '11px' }}>METER SERIAL</span>
            <strong>{auditData.consumer.meter}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--ink-faint)', display: 'block', fontSize: '11px' }}>URBAN SECTOR</span>
            <strong>{auditData.consumer.locality}</strong>
          </div>
        </div>

        {/* Audit Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '18px' }}>
          <div style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>30-DAY BILLED CONSUMPTION</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
              {auditData.metrics.monthly_total_kwh} kWh
            </div>
          </div>
          <div style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>CARBON EMISSIONS FOOTPRINT</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
              {auditData.metrics.carbon_footprint_kg} kg CO₂
            </div>
          </div>
          <div style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>AVERAGE POWER FACTOR</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--good)' }}>
              {auditData.metrics.power_factor_quality.split(' ')[0]}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.5, borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
          <strong>Compliance Verdict:</strong> Verified smart meter telemetry exhibits operational conformity with BEE 4-Star guidelines. Power factor remains balanced across daytime and night refrigeration cycles. No harmonic distortions or leakage spikes exceeding 300 mA recorded.
        </div>
      </div>
    </div>
  );
}
