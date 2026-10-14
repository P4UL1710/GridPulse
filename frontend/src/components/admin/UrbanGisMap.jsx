import React, { useState, useEffect } from 'react';
import { getGisDistributionMap, dispatchGisCrew } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { playChime } from '../../services/audio';

export default function UrbanGisMap() {
  const { showToast } = useAuth();
  const [gisData, setGisData] = useState(null);
  const [selectedFeeder, setSelectedFeeder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);

  const fetchGis = async () => {
    try {
      const data = await getGisDistributionMap();
      setGisData(data);
      if (data.feeders && data.feeders.length > 0 && !selectedFeeder) {
        // select first abnormal feeder or first one
        const alertFeeder = data.feeders.find((f) => f.status.includes('OVER') || f.status.includes('CRITICAL'));
        setSelectedFeeder(alertFeeder || data.feeders[0]);
      } else if (selectedFeeder && data.feeders) {
        // keep selected feeder updated
        const updated = data.feeders.find((f) => f.id === selectedFeeder.id);
        if (updated) setSelectedFeeder(updated);
      }
    } catch (err) {
      console.error('Failed to load GIS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGis();
    const interval = setInterval(fetchGis, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (feederId) => {
    setDispatching(true);
    try {
      const res = await dispatchGisCrew(feederId);
      playChime('chime');
      showToast(res.message);
      // Refresh GIS
      fetchGis();
    } catch (err) {
      showToast('⚠️ Failed to dispatch maintenance crew');
    } finally {
      setDispatching(false);
    }
  };

  if (loading && !gisData) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
          Connecting to City SCADA Telemetry &amp; GIS Feeder Geo-nodes...
        </div>
      </div>
    );
  }

  const summary = gisData?.summary || {};
  const feeders = gisData?.feeders || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top SCADA KPI Strip */}
      <div className="card">
        <div className="section-flex">
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
              🗺️ Urban GIS Feeder SCADA &amp; Outage Heatmap
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              Real-time distribution transformer (DT) telemetry, oil temperature monitoring, and line crew dispatch.
            </div>
          </div>
          <span className={`pill ${summary.system_health === 'OPTIMAL' ? 'pill-good' : 'pill-danger'}`}>
            ● System Health: {summary.system_health}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Substations / DTs</div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px' }}>{summary.total_feeders} Nodes</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Overheat / Alert</div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px', color: summary.overloaded_count > 0 ? '#ef4444' : '#10b981' }}>
              {summary.overloaded_count} Active
            </div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Grid Frequency</div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px' }}>{summary.grid_frequency_hz} Hz</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Average Grid PF</div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px' }}>{summary.average_grid_pf}</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Monitored Citizens</div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px' }}>{summary.total_consumers_monitored?.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Layout: Interactive Map Canvas + Feeder Diagnostic HUD */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Geographic / Schematic Map Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-flex" style={{ marginBottom: '12px' }}>
            <span className="section-title">City Distribution Grid Nodes (Geo-Schematic)</span>
            <span style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>Click node to inspect telemetry</span>
          </div>

          <div
            style={{
              position: 'relative',
              background: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%), var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              height: '420px',
              overflow: 'hidden'
            }}
          >
            {/* SVG Connecting Grid Lines / Feeders */}
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              viewBox="0 0 600 420"
            >
              <defs>
                <linearGradient id="gridLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* Feeder transmission line paths */}
              <line x1="120" y1="120" x2="300" y2="80" stroke="url(#gridLineGrad)" strokeWidth="2" strokeDasharray="4,4" />
              <line x1="300" y1="80" x2="480" y2="150" stroke="url(#gridLineGrad)" strokeWidth="2" strokeDasharray="4,4" />
              <line x1="120" y1="120" x2="180" y2="280" stroke="url(#gridLineGrad)" strokeWidth="2" strokeDasharray="4,4" />
              <line x1="180" y1="280" x2="380" y2="320" stroke="url(#gridLineGrad)" strokeWidth="2" strokeDasharray="4,4" />
              <line x1="480" y1="150" x2="380" y2="320" stroke="url(#gridLineGrad)" strokeWidth="2" strokeDasharray="4,4" />
              <line x1="300" y1="80" x2="380" y2="320" stroke="url(#gridLineGrad)" strokeWidth="2" strokeDasharray="4,4" />
            </svg>

            {/* Interactive Feeder Node Markers */}
            {feeders.map((feeder, idx) => {
              // Normalized coordinates for mock map display
              const coords = [
                { top: '24%', left: '16%' }, // SS-01 Sector 4
                { top: '15%', left: '50%' }, // SS-02 Sector 7
                { top: '32%', left: '78%' }, // SS-03 Ind Area
                { top: '64%', left: '26%' }, // SS-04 Cyber Park
                { top: '74%', left: '62%' }, // SS-05 Green Valley
                { top: '48%', left: '46%' }  // SS-06 Block C
              ][idx] || { top: `${30 + idx * 10}%`, left: `${20 + idx * 12}%` };

              const isSelected = selectedFeeder && selectedFeeder.id === feeder.id;
              const isOverheat = feeder.status === 'CRITICAL_OVERHEAT';
              const isWarning = feeder.status === 'OVERLOAD_WARNING' || feeder.status === 'POWER_FACTOR_ALERT';
              const isSolar = feeder.status === 'SOLAR_FEEDBACK';

              const statusColor = isOverheat
                ? '#ef4444'
                : isWarning
                ? '#f59e0b'
                : isSolar
                ? '#059669'
                : '#2563eb';

              return (
                <div
                  key={feeder.id}
                  onClick={() => setSelectedFeeder(feeder)}
                  style={{
                    position: 'absolute',
                    top: coords.top,
                    left: coords.left,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: isSelected ? 10 : 2
                  }}
                >
                  <div
                    style={{
                      width: isSelected ? '46px' : '36px',
                      height: isSelected ? '46px' : '36px',
                      borderRadius: '50%',
                      background: statusColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '11px',
                      boxShadow: isSelected ? `0 0 0 6px rgba(226, 150, 35, 0.3), 0 8px 16px rgba(0,0,0,0.3)` : '0 4px 10px rgba(0,0,0,0.2)',
                      border: '2px solid #fff',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {isSolar ? '☀️' : isOverheat ? '🔥' : '⚡'}
                  </div>
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      marginTop: '4px',
                      textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {feeder.id} &bull; {feeder.load_pct}%
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--ink-soft)' }}>
            <span>🔵 Normal Operational</span>
            <span>🟢 Solar Feedback Node</span>
            <span>🟠 Overload Alert (&gt;90%)</span>
            <span>🔴 Critical Overheat (&gt;80°C)</span>
          </div>
        </div>

        {/* Selected Feeder Diagnostics & Emergency Dispatch HUD */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {selectedFeeder ? (
            <div>
              <div className="section-flex">
                <div>
                  <span className="pill pill-info" style={{ fontSize: '10.5px' }}>{selectedFeeder.id}</span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '17px', fontWeight: 800 }}>{selectedFeeder.name}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>{selectedFeeder.location}</div>
                </div>
                <span
                  className={`pill ${
                    selectedFeeder.status === 'CRITICAL_OVERHEAT'
                      ? 'pill-danger'
                      : selectedFeeder.status.includes('WARNING') || selectedFeeder.status.includes('ALERT')
                      ? 'pill-warning'
                      : 'pill-good'
                  }`}
                >
                  {selectedFeeder.status}
                </span>
              </div>

              {/* Load Percentage Progress Bar */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                  <span>Transformer Load Ratio</span>
                  <span style={{ color: selectedFeeder.load_pct > 90 ? '#ef4444' : 'inherit' }}>
                    {selectedFeeder.load_pct}% of {selectedFeeder.rating_kva} kVA
                  </span>
                </div>
                <div style={{ background: 'var(--bg-subtle)', height: '10px', borderRadius: '5px', overflow: 'hidden', marginTop: '6px', border: '1px solid var(--border)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, selectedFeeder.load_pct)}%`,
                      background: selectedFeeder.load_pct > 90 ? '#ef4444' : selectedFeeder.load_pct > 75 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>

              {/* Technical Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '14px' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Oil Temperature</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px', color: selectedFeeder.oil_temp_c > 75 ? '#ef4444' : 'inherit' }}>
                    {selectedFeeder.oil_temp_c}°C
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Max safe limit: 75°C</div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Power Factor</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px', color: selectedFeeder.power_factor < 0.90 ? '#ef4444' : 'inherit' }}>
                    {selectedFeeder.power_factor}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Grid target: &gt;0.95</div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Phase Voltages (A/B/C)</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    {selectedFeeder.voltage_a}V &bull; {selectedFeeder.voltage_b}V &bull; {selectedFeeder.voltage_c}V
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Solar PV Penetration</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px', color: '#059669' }}>
                    {selectedFeeder.solar_penetration_pct}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Rooftop prosumer flow</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '14px', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: '8px' }}>
                👥 <strong>{selectedFeeder.consumers_count} connected consumers</strong> supplied through this substation.
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
              Select a feeder node from the map to inspect telemetry
            </div>
          )}

          {/* Action Button: Emergency Dispatch */}
          {selectedFeeder && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '16px' }}>
              <button
                className={`btn ${selectedFeeder.status === 'NORMAL' || selectedFeeder.status === 'SOLAR_FEEDBACK' ? 'btn-outline' : 'btn-primary'}`}
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={dispatching || selectedFeeder.crew_dispatched}
                onClick={() => handleDispatch(selectedFeeder.id)}
              >
                {selectedFeeder.crew_dispatched
                  ? '✓ Line Crew Dispatched (Balancing Active)'
                  : dispatching
                  ? 'Dispatching Maintenance Crew...'
                  : selectedFeeder.status === 'CRITICAL_OVERHEAT'
                  ? '🚨 Dispatch Emergency Crew & Shed Peak Load'
                  : '🔧 Dispatch Preventative Maintenance Crew'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
