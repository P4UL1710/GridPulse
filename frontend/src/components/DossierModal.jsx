import React from 'react';

export default function DossierModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const papers = [
    { title: "Review of Smart Meter Data Analytics: Applications & Challenges", source: "arXiv", concept: "Smart meter data stream ingestion & analytical architectures" },
    { title: "Energy Consumption Forecasting for Smart Meters", source: "arXiv", concept: "Rolling-window regression & consumption trend forecasting" },
    { title: "Forecasting Electricity Smart Meter Data Using Conditional KDE", source: "arXiv", concept: "Probabilistic billing estimation & predictive confidence bands" },
    { title: "The Energy Prediction Smart-Meter Dataset & Benchmarks", source: "arXiv", concept: "Interpretable energy features for consumer dashboards" },
    { title: "IoT Based Smart Energy Meter System Using Machine Learning", source: "SAGE Journals", concept: "Sensor telemetry bridge linked with modern responsive web apps" },
    { title: "AI-Assisted Automatic Billing & Metering System Design", source: "ScienceDirect", concept: "Discrepancy detection algorithms & automated grievance evidence" },
    { title: "IoT Smart Meter Data Analysis Using ML Classifiers", source: "IJERST", concept: "Anomaly load classification & voltage fluctuation tracing" },
    { title: "The Impact of Real-Time & Disaggregated Energy Feedback", source: "SSRN", concept: "Appliance-level energy feedback for targeted domestic conservation" },
    { title: "Smart Energy Forecasting using IoT, ML & Web App", source: "IRE Journals", concept: "Full-stack IoT-to-cloud reactive architecture" },
    { title: "Smart Energy System with Predictive Billing (VoltEdge)", source: "SSRN", concept: "Role-based urban utility workflows & tokenized complaint queues" }
  ];

  const requirements = [
    { id: "FR1", name: "User Registration & Authentication", desc: "Citizen and Utility Admin authentication with locality sector assignments & smart meter serials." },
    { id: "FR2", name: "Real-Time Electricity Monitoring", desc: "Continuous 3-second smart meter telemetry tracking active kW, 230V voltage, current, frequency, and live sparkline." },
    { id: "FR3", name: "Electricity Bill Prediction", desc: "AI rolling regression projecting end-of-month units and multi-slab tariff calculation (0-100 @ ₹4.5, 101-300 @ ₹6.5, >300 @ ₹8.2) + fixed charges & duty." },
    { id: "FR4", name: "Budget-Based Energy Suggestions", desc: "Dynamic target budget tracker, status indicators, and appliance energy disaggregation (AC, fridge, geyser, lighting, standby)." },
    { id: "FR5", name: "Complaint Registration", desc: "Structured grievance filing with category, severity, and auto-attachment of 60-day verified IoT telemetry proof." },
    { id: "FR6", name: "Token Generation", desc: "Instant generation of unique tokens (e.g. GP-50142) with 4-step progress stepper tracking." },
    { id: "FR7", name: "Appointment Scheduling", desc: "Scheduled appointment generation with selection between Online Video and Offline Visit (defaulting to Offline)." },
    { id: "FR8", name: "Customer Service Notification & 4h Lock", desc: "Consultation mode is strictly locked within 4 hours of appointment. Automated 2-hour advance alerts dispatched." },
    { id: "FR9", name: "Bill Comparison & Discrepancy Detection", desc: "Compares invoiced utility bill against AI prediction. Discrepancy >= ₹150 triggers alert and 1-click dispute action." },
    { id: "FR10", name: "AI Consumption Report & Official Audit", desc: "Graphical daily, weekly load profiles with a print-ready official Energy Audit Certificate." },
    { id: "FR11", name: "Comprehensive Citizen Dashboard", desc: "Unified console with live meter, forecast progress, budget planner, quick grievance filing, and notification center." },
    { id: "FR12", name: "Admin Operations Console", desc: "Urban console displaying registered consumers, open complaints, peak demand sectors, category doughnuts, and 14-day inflow trends." },
    { id: "FR13", name: "Complaint Tracking & Staff Dispatch", desc: "Queue management, staff assignment dropdown, status transition logging, and resolution duration tracking." },
    { id: "FR14", name: "Historical Billing & CSV Export", desc: "6-month billing table with variance tags and instant CSV export." }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span className="pill pill-info">Academic Dossier</span>
            <h2 className="modal-title" style={{ marginTop: '6px', marginBottom: '2px' }}>
              GridPulse Project Dossier &amp; Traceability
            </h2>
            <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
              Teacher Problem Statement: <em>"Observe operational patterns in urban environments and demonstrate a very basic system for improvement."</em>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--primary)', marginBottom: '8px' }}>
            📚 Academic Literature Review (10 Research Papers)
          </h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px' }}>
            {papers.map((p, idx) => (
              <div key={idx} style={{ padding: '8px', borderBottom: idx < papers.length - 1 ? '1px solid var(--line-subtle)' : 'none', fontSize: '12.5px' }}>
                <strong style={{ color: 'var(--ink)' }}>{idx + 1}. {p.title}</strong>
                <span className="pill pill-neutral" style={{ marginLeft: '8px', fontSize: '10.5px' }}>{p.source}</span>
                <div style={{ color: 'var(--ink-soft)', marginTop: '2px' }}>Integrated Concept: {p.concept}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--primary)', marginBottom: '8px' }}>
            📋 Functional Requirements Traceability Matrix (FR1 – FR14)
          </h3>
          <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px' }}>
            {requirements.map((r, idx) => (
              <div key={idx} style={{ padding: '8px', borderBottom: idx < requirements.length - 1 ? '1px solid var(--line-subtle)' : 'none', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pill pill-good" style={{ fontFamily: 'var(--font-mono)' }}>{r.id}</span>
                  <strong>{r.name}</strong>
                </div>
                <div style={{ color: 'var(--ink-soft)', marginTop: '4px', paddingLeft: '4px' }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
