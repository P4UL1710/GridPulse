import React from 'react';

export default function ComplaintsTab({ complaints, onOpenNewGrievance }) {
  const getPillClass = (status) => {
    if (status === 'Resolved') return 'pill-good';
    if (status === 'In Progress') return 'pill-warn';
    if (status === 'Under Review') return 'pill-info';
    return 'pill-neutral';
  };

  return (
    <div>
      <div className="section-flex" style={{ marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>Service Grievances &amp; Resolution Tracking (FR5, FR6)</h2>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            Tokenized ticket status, assigned CSR representatives, and verified telemetry attachments
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onOpenNewGrievance}>
          + Raise New Grievance
        </button>
      </div>

      {complaints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--ink-faint)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
          <div>No service grievances recorded. Click "+ Raise New Grievance" to create an official token.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {complaints.map((c) => {
            const isResolved = c.status === 'Resolved';
            const isInProg = c.status === 'In Progress';
            const isUnderRev = c.status === 'Under Review';

            return (
              <div
                key={c.token}
                className="card"
                style={{
                  borderLeft: `5px solid ${
                    isResolved ? 'var(--good)' : isInProg ? 'var(--warn)' : 'var(--primary)'
                  }`
                }}
              >
                <div className="section-flex" style={{ marginBottom: '6px' }}>
                  <div>
                    <span className="token-tag">{c.token}</span>
                    <strong style={{ marginLeft: '10px', fontSize: '15px' }}>{c.category}</strong>
                  </div>
                  <span className={`pill ${getPillClass(c.status)}`}>{c.status}</span>
                </div>

                {/* 4-Step Status Progress Tracker */}
                <div className="stepper">
                  <div className="step-node completed">● Submitted</div>
                  <div className={`step-line ${isUnderRev || isInProg || isResolved ? 'done' : ''}`} />
                  <div className={`step-node ${isUnderRev ? 'active' : isInProg || isResolved ? 'completed' : ''}`}>
                    ● Under Review
                  </div>
                  <div className={`step-line ${isInProg || isResolved ? 'done' : ''}`} />
                  <div className={`step-node ${isInProg ? 'active' : isResolved ? 'completed' : ''}`}>
                    ● In Progress
                  </div>
                  <div className={`step-line ${isResolved ? 'done' : ''}`} />
                  <div className={`step-node ${isResolved ? 'completed active' : ''}`}>
                    ● Resolved
                  </div>
                </div>

                <p style={{ margin: '10px 0', fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                  {c.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    fontSize: '11.5px',
                    color: 'var(--ink-faint)',
                    borderTop: '1px solid var(--line-subtle)',
                    paddingTop: '10px'
                  }}
                >
                  <span>
                    Raised: {new Date(c.raised_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span>
                    Mode: <strong>{c.mode === 'online' ? '🌐 Online Video' : '🏢 Offline Office Visit'}</strong>
                  </span>
                  <span>
                    Assigned Officer: <strong>{c.assigned_staff || 'Queue Pending'}</strong>
                  </span>
                  {c.resolution_hours && (
                    <span style={{ color: 'var(--good)', fontWeight: 600 }}>
                      Resolved in {c.resolution_hours} hrs
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
