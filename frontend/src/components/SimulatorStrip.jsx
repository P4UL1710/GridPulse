import React, { useState } from 'react';
import { setSimulatorScenario, toggleSolar } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { playChime } from '../services/audio';

export default function SimulatorStrip({ currentScenario, onScenarioChanged }) {
  const { audioOn, toggleSound, showToast } = useAuth();
  const [solarActive, setSolarActive] = useState(true);

  const handleSelect = async (scenario) => {
    try {
      await setSimulatorScenario(scenario);
      if (onScenarioChanged) onScenarioChanged(scenario);

      if (scenario === 'leak') {
        playChime('warn');
        showToast('⚠️ Anomaly simulation activated: Load spike detected!');
      } else if (scenario === 'peak') {
        showToast('🌆 Peak evening scenario active (~3.6 kW)');
      } else if (scenario === 'ac') {
        showToast('❄️ High AC compressor load active (~4.8 kW)');
      } else if (scenario === 'solar_boost') {
        showToast('☀️ Solar Generation Peak Active (+3.8 kW export potential)');
      } else if (scenario === 'inductive_sag') {
        playChime('warn');
        showToast('⚡ Inductive Sag Active: PF drops to 0.82, THD spikes to 7.8%');
      } else {
        showToast('✅ Normal domestic load active (~1.2 kW)');
      }
    } catch (err) {
      showToast('⚠️ Failed to change simulator scenario');
    }
  };

  const handleToggleSolar = async () => {
    try {
      const nextState = !solarActive;
      await toggleSolar(nextState);
      setSolarActive(nextState);
      showToast(nextState ? '☀️ Rooftop Solar Net-Metering PV Connected' : '🌑 Solar PV Array Disconnected from Grid');
    } catch (err) {
      showToast('⚠️ Failed to toggle solar PV array');
    }
  };

  return (
    <div className="sim-strip">
      <div className="sim-label">
        <span className="sim-badge">IoT LAB SIMULATOR</span>
        <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
          Observe real-time grid behavior under synthetic domestic loads &amp; solar generation
        </span>
      </div>

      <div className="sim-actions" style={{ flexWrap: 'wrap' }}>
        <button
          className={`sim-btn ${currentScenario === 'normal' ? 'active' : ''}`}
          onClick={() => handleSelect('normal')}
        >
          Normal (1.2 kW)
        </button>
        <button
          className={`sim-btn ${currentScenario === 'peak' ? 'active' : ''}`}
          onClick={() => handleSelect('peak')}
        >
          Peak Tariff (3.6 kW)
        </button>
        <button
          className={`sim-btn ${currentScenario === 'ac' ? 'active' : ''}`}
          onClick={() => handleSelect('ac')}
        >
          High AC (4.8 kW)
        </button>
        <button
          className={`sim-btn ${currentScenario === 'solar_boost' ? 'active' : ''}`}
          onClick={() => handleSelect('solar_boost')}
        >
          ☀️ Solar Boost
        </button>
        <button
          className={`sim-btn ${currentScenario === 'inductive_sag' ? 'active' : ''}`}
          onClick={() => handleSelect('inductive_sag')}
        >
          ⚡ Inductive Sag (Low PF)
        </button>
        <button
          className={`sim-btn ${currentScenario === 'leak' ? 'active' : ''}`}
          onClick={() => handleSelect('leak')}
        >
          Discrepancy Spike
        </button>
        <button
          className={`sim-btn ${solarActive ? 'active' : ''}`}
          onClick={handleToggleSolar}
          style={{ borderColor: solarActive ? '#f59e0b' : 'var(--border)' }}
          title="Toggle rooftop solar net-metering array"
        >
          {solarActive ? '☀️ Solar: ON' : '🌑 Solar: OFF'}
        </button>
        <button
          className="sim-btn"
          onClick={toggleSound}
          style={{ marginLeft: '4px' }}
        >
          {audioOn ? '🔔 Sound' : '🔕 Mute'}
        </button>
      </div>
    </div>
  );
}
