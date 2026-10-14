import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { getAdminOverview } from '../../services/api';

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const locChartRef = useRef(null);
  const catChartRef = useRef(null);
  const trendChartRef = useRef(null);

  const locChartInstance = useRef(null);
  const catChartInstance = useRef(null);
  const trendChartInstance = useRef(null);

  useEffect(() => {
    let mounted = true;
    getAdminOverview()
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching admin overview:', err);
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return;

    // Locality Bar Chart
    if (locChartRef.current) {
      if (locChartInstance.current) locChartInstance.current.destroy();

      locChartInstance.current = new Chart(locChartRef.current, {
        type: 'bar',
        data: {
          labels: data.locality_stats.map((l) => l.loc),
          datasets: [
            {
              label: 'Demand (kWh/day)',
              data: data.locality_stats.map((l) => l.kwh),
              backgroundColor: 'rgba(25, 72, 77, 0.75)',
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

    // Category Doughnut Chart
    if (catChartRef.current) {
      if (catChartInstance.current) catChartInstance.current.destroy();

      const catLabels = Object.keys(data.category_counts);
      const catValues = catLabels.map((k) => data.category_counts[k]);

      catChartInstance.current = new Chart(catChartRef.current, {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [
            {
              data: catValues,
              backgroundColor: [
                '#19484D',
                '#E29623',
                '#2F855A',
                '#C67817',
                '#C53030'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, font: { size: 11 } }
            }
          }
        }
      });
    }

    // Trend Line Chart
    if (trendChartRef.current) {
      if (trendChartInstance.current) trendChartInstance.current.destroy();

      trendChartInstance.current = new Chart(trendChartRef.current, {
        type: 'line',
        data: {
          labels: data.trend_days.map((d) => d.label),
          datasets: [
            {
              label: 'Complaints Inflow',
              data: data.trend_days.map((d) => d.count),
              borderColor: '#E29623',
              backgroundColor: 'rgba(226, 150, 35, 0.16)',
              fill: true,
              tension: 0.35,
              pointRadius: 3
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
      if (locChartInstance.current) locChartInstance.current.destroy();
      if (catChartInstance.current) catChartInstance.current.destroy();
      if (trendChartInstance.current) trendChartInstance.current.destroy();
    };
  }, [data]);

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading Urban Operations Analytics...</div>;
  }

  if (!data) return null;

  return (
    <div>
      {/* KPI Cards Row */}
      <div className="grid-4" style={{ marginBottom: '18px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
            REGISTERED SMART CONSUMERS
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
            {data.kpis.total_consumers.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--good)', marginTop: '2px' }}>
            ● 100% AMI Telemetry Active
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
            OPEN GRIEVANCES IN QUEUE
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
            {data.kpis.open_complaints_count} Pending
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
            {data.kpis.in_progress_count} in progress &bull; {data.kpis.submitted_count} new
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
            AVG GRIEVANCE RESOLUTION TIME
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
            {data.kpis.avg_resolution_hours} hrs
          </div>
          <div style={{ fontSize: '11px', color: 'var(--good)', marginTop: '2px' }}>
            Within 24h Urban SLA
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
            PEAK DEMAND SECTOR
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
            {data.kpis.peak_locality}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>
            {data.kpis.peak_locality_kwh} kWh peak today
          </div>
        </div>
      </div>

      {/* Urban Sector Hotspot Grid */}
      <div className="card" style={{ marginBottom: '18px' }}>
        <div className="section-title">Urban Sector Health &amp; Demand Hotspots</div>
        <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
          Real-time telemetry aggregation across distribution feeder transformers
        </div>

        <div className="hotspot-grid">
          {data.locality_stats.map((s, idx) => (
            <div key={idx} className="hotspot-card">
              <div className="hotspot-head">
                <span className="hotspot-name">{s.loc}</span>
                <span className={`pill ${s.pill}`}>{s.status}</span>
              </div>
              <div className="hotspot-metrics">
                <span>Demand: <strong>{s.kwh} kWh/d</strong></span>
                <span>Tickets: <strong>{s.complaints_in_area} open</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid-3">
        <div className="card">
          <div className="section-title" style={{ marginBottom: '8px' }}>Peak Consumption by Sector</div>
          <div style={{ height: '220px', width: '100%' }}>
            <canvas ref={locChartRef} />
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: '8px' }}>Complaint Categories</div>
          <div style={{ height: '220px', width: '100%' }}>
            <canvas ref={catChartRef} />
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: '8px' }}>14-Day Grievance Inflow</div>
          <div style={{ height: '220px', width: '100%' }}>
            <canvas ref={trendChartRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
