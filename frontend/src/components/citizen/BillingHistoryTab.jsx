import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { getBillingHistory } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BillingHistoryTab() {
  const { currentUser, showToast } = useAuth();
  const [historyRows, setHistoryRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    let mounted = true;
    getBillingHistory()
      .then((data) => {
        if (mounted) {
          setHistoryRows(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching billing history:', err);
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!historyRows.length || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const formatMonth = (m) => {
      const parts = m.split('-');
      return new Date(parts[0], parts[1] - 1, 1).toLocaleDateString([], {
        month: 'short',
        year: '2-digit'
      });
    };

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: historyRows.map((r) => formatMonth(r.month)),
        datasets: [
          {
            label: 'AI Forecasted (₹)',
            data: historyRows.map((r) => r.predicted),
            backgroundColor: 'rgba(25, 72, 77, 0.75)',
            borderRadius: 6
          },
          {
            label: 'Actual Invoiced (₹)',
            data: historyRows.map((r) => r.actual),
            backgroundColor: 'rgba(226, 150, 35, 0.85)',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { family: 'IBM Plex Sans', size: 12 } }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(213, 222, 213, 0.5)' } }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [historyRows]);

  const handleExportCSV = () => {
    let csv = 'Month,Units_kWh,AI_Predicted_INR,Actual_Invoiced_INR,Variance_INR,Discrepancy_Flag\n';
    historyRows.forEach((r) => {
      csv += `${r.month},${r.units},${r.predicted},${r.actual},${r.diff},${r.is_discrepancy ? 'YES' : 'NO'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GridPulse_${currentUser?.meter || 'MTR'}_Billing_History.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 6-month consumption history exported to CSV');
  };

  const formatMonth = (m) => {
    const parts = m.split('-');
    return new Date(parts[0], parts[1] - 1, 1).toLocaleDateString([], {
      month: 'short',
      year: '2-digit'
    });
  };

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading billing records...</div>;
  }

  return (
    <div>
      <div className="section-flex" style={{ marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>Historical Billing &amp; Variance Analytics (FR14)</h2>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            Audit trail of billed charges, AI benchmark comparisons, and discrepancy flags
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleExportCSV}>
          📥 Export CSV
        </button>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: '18px' }}>
        <div className="section-title" style={{ marginBottom: '12px' }}>
          6-Month AI Predicted vs Actual Invoiced Charges (₹)
        </div>
        <div style={{ height: '260px', width: '100%' }}>
          <canvas ref={chartRef} />
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Billing Month</th>
              <th>Units Consumed</th>
              <th>AI Predicted (₹)</th>
              <th>Actual Invoiced (₹)</th>
              <th>Tolerance Variance</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.map((r, idx) => (
              <tr key={idx}>
                <td><strong>{formatMonth(r.month)}</strong></td>
                <td>{r.units} kWh</td>
                <td>₹{r.predicted.toLocaleString('en-IN')}</td>
                <td>₹{r.actual.toLocaleString('en-IN')}</td>
                <td>
                  {r.is_discrepancy ? (
                    <span className="pill pill-warn">⚠️ ₹{Math.abs(r.diff)} (Discrepancy)</span>
                  ) : (
                    <span className="pill pill-good">&plusmn;₹{Math.abs(r.diff)} (Normal)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
