import React, { useState, useEffect } from 'react';
import { getToUSchedule, calculateEvSchedule, getSustainabilityLeaderboard } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ToUEvSchedulerTab() {
  const { showToast } = useAuth();
  const [touData, setTouData] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scheduler Form State
  const [loadType, setLoadType] = useState('4_wheeler');
  const [batteryKwh, setBatteryKwh] = useState(30.0);
  const [chargerKw, setChargerKw] = useState(7.4);
  const [currentSoc, setCurrentSoc] = useState(25);
  const [targetSoc, setTargetSoc] = useState(90);
  const [targetHour, setTargetHour] = useState(8); // 8:00 AM
  const [scheduleResult, setScheduleResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [smartChargeAutomated, setSmartChargeAutomated] = useState(true);

  // Preset Selector Helper
  const handlePresetChange = (type) => {
    setLoadType(type);
    if (type === '4_wheeler') {
      setBatteryKwh(30.0);
      setChargerKw(7.4);
    } else if (type === '2_wheeler') {
      setBatteryKwh(4.0);
      setChargerKw(3.3);
    } else if (type === 'washing_machine') {
      setBatteryKwh(2.2);
      setChargerKw(1.8);
      setCurrentSoc(0);
      setTargetSoc(100);
    } else if (type === 'water_heater') {
      setBatteryKwh(4.5);
      setChargerKw(2.0);
      setCurrentSoc(0);
      setTargetSoc(100);
    }
    setScheduleResult(null);
  };

  useEffect(() => {
    Promise.all([getToUSchedule(), getSustainabilityLeaderboard()])
      .then(([touRes, leadRes]) => {
        setTouData(touRes);
        setLeaderboard(leadRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load ToU and Leaderboard data:', err);
        setLoading(false);
      });
  }, []);

  const handleComputeSchedule = async (e) => {
    if (e) e.preventDefault();
    setIsCalculating(true);
    try {
      const res = await calculateEvSchedule({
        load_type: loadType,
        battery_kwh: parseFloat(batteryKwh),
        charger_kw: parseFloat(chargerKw),
        target_departure_hour: parseInt(targetHour),
        current_soc_pct: parseInt(currentSoc),
        target_soc_pct: parseInt(targetSoc)
      });
      setScheduleResult(res);
      showToast('⚡ Optimal Off-Peak charging window calculated!');
    } catch (err) {
      showToast('⚠️ Could not calculate charging schedule');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(226, 150, 35, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)' }}>
        <div className="section-flex">
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
              ⏱️ Time-of-Use (ToU) Dynamic Tariffs &amp; Smart EV Scheduler
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              Arbitrage daily wholesale tariff differentials. Automate overnight charging to slash energy bills by up to 46%.
            </div>
          </div>
          {touData && (
            <div style={{ textAlign: 'right' }}>
              <span className={`pill ${touData.current_badge === 'danger' ? 'pill-danger' : touData.current_badge === 'good' ? 'pill-good' : 'pill-info'}`}>
                ● Active: {touData.current_tier} (₹{touData.current_rate_inr.toFixed(2)}/kWh)
              </span>
              <div style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '4px' }}>
                Transitions to {touData.next_tier} in {touData.hours_to_transition}h
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 24-Hour Visual Tariff Timeline */}
      <div className="card">
        <span className="section-title">24-Hour Dynamic Tariff Profile (City DISCOM Grid)</span>
        <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginBottom: '14px' }}>
          Current hour highlighted with pulsing marker. Peak rates apply 18:00 - 22:00.
        </div>

        {touData && touData.schedule && (
          <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(36px, 1fr))', gap: '4px', minWidth: '780px' }}>
              {touData.schedule.map((slot) => {
                const isPeak = slot.tier === 'Peak';
                const isOffPeak = slot.tier === 'Off-Peak';
                return (
                  <div
                    key={slot.hour}
                    style={{
                      background: slot.is_current
                        ? 'var(--accent)'
                        : isPeak
                        ? 'rgba(239, 68, 68, 0.18)'
                        : isOffPeak
                        ? 'rgba(16, 185, 129, 0.18)'
                        : 'var(--bg-subtle)',
                      border: slot.is_current
                        ? '2px solid var(--accent)'
                        : `1px solid ${isPeak ? '#ef4444' : isOffPeak ? '#10b981' : 'var(--border)'}`,
                      borderRadius: '6px',
                      padding: '8px 2px',
                      textAlign: 'center',
                      color: slot.is_current ? '#fff' : 'var(--ink)',
                      transition: 'transform 0.15s ease'
                    }}
                    title={`${slot.label} - ${slot.tier} (₹${slot.rate_inr}/kWh)`}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 700 }}>{slot.label}</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '4px' }}>
                      ₹{slot.rate_inr.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '8.5px', marginTop: '2px', opacity: 0.85 }}>
                      {slot.tier.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '18px', marginTop: '12px', fontSize: '12px', color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.4)' }} />
            <span>Off-Peak (₹4.88/kWh &bull; 11:00-16:00 &amp; 23:00-05:00)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--bg-subtle)' }} />
            <span>Standard (₹6.50/kWh &bull; Daylight Base)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.4)' }} />
            <span>Peak Surcharge (₹9.10/kWh &bull; 18:00-22:00)</span>
          </div>
        </div>
      </div>

      {/* Grid 2 Columns: EV Scheduler Form & Calculation HUD */}
      <div className="grid-2">
        {/* Scheduler Form */}
        <div className="card">
          <span className="section-title">⚡ Smart Load &amp; EV Scheduler</span>
          <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginBottom: '16px' }}>
            Select your vehicle or heavy load to calculate optimal charging windows.
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              type="button"
              className={`btn ${loadType === '4_wheeler' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', padding: '6px 10px', height: 'auto' }}
              onClick={() => handlePresetChange('4_wheeler')}
            >
              🚗 4-W EV (30 kWh)
            </button>
            <button
              type="button"
              className={`btn ${loadType === '2_wheeler' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', padding: '6px 10px', height: 'auto' }}
              onClick={() => handlePresetChange('2_wheeler')}
            >
              🛵 2-W EV (4 kWh)
            </button>
            <button
              type="button"
              className={`btn ${loadType === 'washing_machine' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', padding: '6px 10px', height: 'auto' }}
              onClick={() => handlePresetChange('washing_machine')}
            >
              🧺 Washing Cycle
            </button>
            <button
              type="button"
              className={`btn ${loadType === 'water_heater' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', padding: '6px 10px', height: 'auto' }}
              onClick={() => handlePresetChange('water_heater')}
            >
              ♨️ Water Heater
            </button>
          </div>

          <form onSubmit={handleComputeSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Battery / Energy (kWh)</label>
                <input
                  type="number"
                  step="0.5"
                  className="input"
                  value={batteryKwh}
                  onChange={(e) => setBatteryKwh(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Charger Rating (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={chargerKw}
                  onChange={(e) => setChargerKw(e.target.value)}
                  required
                />
              </div>
            </div>

            {loadType.includes('wheeler') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Current Battery SoC: {currentSoc}%</label>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="5"
                    value={currentSoc}
                    onChange={(e) => setCurrentSoc(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="form-label">Target Charge SoC: {targetSoc}%</label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={targetSoc}
                    onChange={(e) => setTargetSoc(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="form-label">Target Ready By (Morning Departure)</label>
              <select
                className="input"
                value={targetHour}
                onChange={(e) => setTargetHour(e.target.value)}
              >
                <option value="6">06:00 AM</option>
                <option value="7">07:00 AM</option>
                <option value="8">08:00 AM (Recommended)</option>
                <option value="9">09:00 AM</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isCalculating} style={{ marginTop: '4px' }}>
              {isCalculating ? 'Computing Optimal Windows...' : '⚡ Calculate Optimal Schedule & ₹ Savings'}
            </button>
          </form>
        </div>

        {/* Calculation Result HUD */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="section-flex">
              <span className="section-title">Optimal Charging Strategy</span>
              <span className="pill pill-good">AI Arbitrage Active</span>
            </div>

            {scheduleResult ? (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.09)', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '11px', color: '#059669', textTransform: 'uppercase', fontWeight: 700 }}>Recommended Window</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', marginTop: '2px' }}>
                    {scheduleResult.recommended_window.start} &rarr; {scheduleResult.recommended_window.end}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                    {scheduleResult.recommended_window.tariff_tier} &bull; Ready by {scheduleResult.recommended_window.ready_by}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Off-Peak Smart Cost</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                      ₹{scheduleResult.optimized_cost_inr.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Peak Unscheduled Cost</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                      ₹{scheduleResult.unoptimized_cost_inr.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(226, 150, 35, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 700 }}>Direct Savings / Charge</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
                      ₹{scheduleResult.savings_inr.toFixed(2)}{' '}
                      <span style={{ fontSize: '12px', color: '#059669' }}>({scheduleResult.savings_pct}%)</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>Carbon Avoided</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                      🌿 {scheduleResult.carbon_offset_kg} kg CO₂
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  💡 {scheduleResult.smart_tip}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-soft)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔌</div>
                <div style={{ fontWeight: 600 }}>Configure your load settings</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '4px' }}>
                  Click "Calculate Optimal Schedule" to simulate off-peak charging savings vs peak evening grid rates.
                </div>
              </div>
            )}
          </div>

          {scheduleResult && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Automate via DLMS Smart Meter Relay:</span>
              <button
                type="button"
                className={`btn ${smartChargeAutomated ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '11px', padding: '4px 10px', height: 'auto' }}
                onClick={() => {
                  setSmartChargeAutomated(!smartChargeAutomated);
                  showToast(!smartChargeAutomated ? '✓ Auto-schedule locked to meter DLMS relay' : 'Automated relay control disabled');
                }}
              >
                {smartChargeAutomated ? '✓ Relay Armed' : 'Arm Relay'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sustainability & Solar Prosumer Leaderboard */}
      {leaderboard && (
        <div className="card">
          <div className="section-flex">
            <div>
              <span className="section-title">🏆 Urban Sector Clean Energy &amp; Solar Leaderboard</span>
              <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '2px' }}>
                Citywide rooftop solar generation: {leaderboard.city_total_solar_mwh} MWh &bull; {leaderboard.total_co2_offset_tons} Tons CO₂ avoided
              </div>
            </div>
            <span className="pill pill-good">Your Sector Rank: #{leaderboard.your_rank}</span>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Urban Sector Hub</th>
                  <th>Solar Gen (MWh)</th>
                  <th>Efficiency Index</th>
                  <th>CO₂ Offset (Tons)</th>
                  <th>Award Badge</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.leaderboard.map((item) => (
                  <tr
                    key={item.rank}
                    style={{
                      background: item.rank === leaderboard.your_rank ? 'rgba(226, 150, 35, 0.08)' : 'transparent'
                    }}
                  >
                    <td style={{ fontWeight: 800 }}>#{item.rank}</td>
                    <td style={{ fontWeight: 600 }}>
                      {item.sector} {item.rank === leaderboard.your_rank && <span style={{ color: 'var(--accent)' }}>(You)</span>}
                    </td>
                    <td>{item.solar_gen_mwh} MWh</td>
                    <td>
                      <span className="pill pill-info">{item.efficiency_score}/100</span>
                    </td>
                    <td>{item.co2_offset_tons} T</td>
                    <td>
                      <span className="pill pill-good">{item.badge}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
