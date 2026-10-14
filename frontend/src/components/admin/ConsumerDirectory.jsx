import React, { useState } from 'react';
import { simulateConsumer } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { playChime } from '../../services/audio';

export default function ConsumerDirectory({ consumers, onRefreshConsumers }) {
  const { showToast } = useAuth();
  const [adding, setAdding] = useState(false);

  const handleAddConsumer = async () => {
    setAdding(true);
    try {
      const res = await simulateConsumer();
      playChime('good');
      showToast(`Registered consumer ${res.user.name} in ${res.user.locality}`);
      if (onRefreshConsumers) onRefreshConsumers();
    } catch (err) {
      showToast('⚠️ Failed to add simulated consumer');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="section-flex" style={{ marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>Registered Consumers &amp; Smart Meter Directory</h2>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            Urban consumer database with automated smart-meter DLMS/COSEM serial numbers and budget boundaries
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAddConsumer}
          disabled={adding}
        >
          {adding ? 'Adding...' : '+ Add Simulated Consumer'}
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Consumer Name</th>
              <th>Email / ID</th>
              <th>Smart Meter Serial</th>
              <th>Locality / Sector</th>
              <th>Month-to-Date Load</th>
              <th>Target Budget Boundary</th>
            </tr>
          </thead>
          <tbody>
            {consumers.map((u, idx) => (
              <tr key={idx}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className="token-tag">{u.meter}</span></td>
                <td>{u.locality}</td>
                <td>{u.mtd_units} kWh / mo</td>
                <td>₹{u.budget_low} – ₹{u.budget_high}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
