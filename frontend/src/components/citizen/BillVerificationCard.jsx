import React, { useState } from 'react';
import { verifyBill } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { playChime } from '../../services/audio';

export default function BillVerificationCard({ onTriggerDisputeModal }) {
  const { showToast } = useAuth();
  const [billInput, setBillInput] = useState('1680');
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (valToVerify) => {
    const val = valToVerify || billInput;
    if (!val || parseFloat(val) <= 0) {
      showToast('⚠️ Enter a valid invoiced bill amount');
      return;
    }
    setVerifying(true);
    try {
      const res = await verifyBill(val);
      setResult(res);
      if (res.is_discrepancy) {
        playChime('warn');
        showToast(`⚠️ Discrepancy of ₹${Math.abs(Math.round(res.difference))} detected!`);
      } else {
        playChime('good');
        showToast('✅ Invoiced bill verified! Matches AI prediction.');
      }
    } catch (err) {
      showToast('⚠️ Error verifying bill');
    } finally {
      setVerifying(false);
    }
  };

  const handleQuickValue = (val) => {
    setBillInput(val.toString());
    handleVerify(val.toString());
  };

  return (
    <div className="card">
      <div className="section-flex">
        <div>
          <span className="section-title">Smart Bill Verification &amp; Discrepancy (FR9)</span>
          <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '2px' }}>
            Automated tolerance verification (&plusmn;₹150 threshold) &amp; evidence dispute
          </div>
        </div>
        <span className="pill pill-warn">Discrepancy Tool</span>
      </div>

      <p className="lede" style={{ marginBottom: '14px' }}>
        Compare your utility invoice against IoT meter telemetry. If the variance exceeds ₹150, GridPulse synthesizes verifiable dispute evidence.
      </p>

      {/* Input and Quick buttons */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ flex: '1', minWidth: '160px' }}>
          <input
            type="number"
            value={billInput}
            onChange={(e) => setBillInput(e.target.value)}
            placeholder="Enter actual bill in ₹"
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '14px' }}
          />
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleVerify()}
          disabled={verifying}
        >
          {verifying ? 'Verifying...' : 'Verify Invoiced Bill'}
        </button>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => handleQuickValue(1140)}
            title="Set normal matching bill"
          >
            Sample: ₹1,140
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => handleQuickValue(1680)}
            title="Set inflated bill with discrepancy"
          >
            Sample Spike: ₹1,680
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {result && (
        <div className={`banner ${result.is_discrepancy ? 'banner-danger' : 'banner-good'}`}>
          <div style={{ fontSize: '20px', flexShrink: 0 }}>
            {result.is_discrepancy ? '⚠️' : '✅'}
          </div>
          <div>
            <strong>
              {result.is_discrepancy
                ? `Discrepancy of ₹${Math.abs(Math.round(result.difference))} Detected`
                : 'Bill Verified: Matches AI Telemetry'}
            </strong>
            <p style={{ marginTop: '4px', fontSize: '12.5px' }}>{result.message}</p>

            {result.is_discrepancy && (
              <button
                className="btn btn-accent btn-sm"
                style={{ marginTop: '10px' }}
                onClick={() =>
                  onTriggerDisputeModal({
                    category: 'Billing discrepancy',
                    severity: 'High',
                    description: result.suggested_dispute_desc
                  })
                }
              >
                File 1-Click Discrepancy Dispute &rarr;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
