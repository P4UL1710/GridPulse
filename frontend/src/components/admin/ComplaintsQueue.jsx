import React, { useState } from 'react';
import { updateComplaintStatus, updateComplaintStaff, seedMoreComplaints } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { playChime } from '../../services/audio';

const STAFF_MEMBERS = [
  "Rajesh Kumar",
  "Ananya Sen",
  "Vikram Malhotra",
  "Priya Sharma",
  "Amit Verma"
];

const LOCALITIES = ["Sector 12", "Riverside", "Old Town", "Tech Park", "Green Hills", "Lakeview"];

export default function ComplaintsQueue({ complaints, onRefreshComplaints }) {
  const { showToast } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [seeding, setSeeding] = useState(false);

  const handleStatusChange = async (token, newStatus) => {
    try {
      await updateComplaintStatus(token, newStatus);
      playChime('good');
      showToast(`Token ${token} transitioned to ${newStatus}`);
      if (onRefreshComplaints) onRefreshComplaints();
    } catch (err) {
      showToast('⚠️ Failed to update complaint status');
    }
  };

  const handleStaffChange = async (token, newStaff) => {
    try {
      await updateComplaintStaff(token, newStaff);
      showToast(`Assigned officer for ${token} updated to ${newStaff}`);
      if (onRefreshComplaints) onRefreshComplaints();
    } catch (err) {
      showToast('⚠️ Failed to reassign officer');
    }
  };

  const handleSeedMore = async () => {
    setSeeding(true);
    try {
      await seedMoreComplaints();
      playChime('warn');
      showToast('5 simulated complaints injected into urban operations queue');
      if (onRefreshComplaints) onRefreshComplaints();
    } catch (err) {
      showToast('⚠️ Failed to seed complaints');
    } finally {
      setSeeding(false);
    }
  };

  const filtered = complaints.filter((c) => {
    const textMatch =
      !search ||
      c.token.toLowerCase().includes(search.toLowerCase()) ||
      c.user_name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());

    const statusMatch = !statusFilter || c.status === statusFilter;
    const locMatch = !locFilter || c.locality === locFilter;

    return textMatch && statusMatch && locMatch;
  });

  return (
    <div>
      <div className="section-flex" style={{ marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>Urban Operations Complaint Queue &amp; Dispatch (FR13)</h2>
          <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            Real-time multi-sector incident triage, staff assignment, and status stepper progression
          </div>
        </div>
        <button
          className="btn btn-accent btn-sm"
          onClick={handleSeedMore}
          disabled={seeding}
        >
          {seeding ? 'Injecting...' : '+ Inject 5 Simulated Grievances'}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by token, citizen name, or category..."
          style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '13px' }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '13px' }}
        >
          <option value="">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          value={locFilter}
          onChange={(e) => setLocFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '13px' }}
        >
          <option value="">All Sectors</option>
          {LOCALITIES.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Citizen Name</th>
              <th>Sector</th>
              <th>Category</th>
              <th>Mode</th>
              <th>Assigned Officer</th>
              <th>Raised Date</th>
              <th>Action / Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.token}>
                <td><span className="token-tag">{c.token}</span></td>
                <td><strong>{c.user_name}</strong></td>
                <td>{c.locality}</td>
                <td>{c.category}</td>
                <td>{c.mode === 'online' ? '🌐 Online' : '🏢 Office'}</td>
                <td>
                  <select
                    value={c.assigned_staff || ''}
                    onChange={(e) => handleStaffChange(c.token, e.target.value)}
                    style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '12px' }}
                  >
                    {STAFF_MEMBERS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {new Date(c.raised_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                </td>
                <td>
                  <select
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.token, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                      fontWeight: 600,
                      fontSize: '12px',
                      color: c.status === 'Resolved' ? 'var(--good)' : c.status === 'In Progress' ? 'var(--warn)' : 'var(--ink)'
                    }}
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
