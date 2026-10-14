import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
import SimulatorStrip from './components/SimulatorStrip';
import NotificationDrawer from './components/NotificationDrawer';
import DossierModal from './components/DossierModal';
import ComplaintModal from './components/ComplaintModal';
import Toast from './components/Toast';

// Citizen components
import CitizenOverview from './components/citizen/CitizenOverview';
import ComplaintsTab from './components/citizen/ComplaintsTab';
import AppointmentsTab from './components/citizen/AppointmentsTab';
import ReportsAuditTab from './components/citizen/ReportsAuditTab';
import BillingHistoryTab from './components/citizen/BillingHistoryTab';
import MeetingPortal from './components/citizen/MeetingPortal';
import ToUEvSchedulerTab from './components/citizen/ToUEvSchedulerTab';
import PowerQualityModal from './components/citizen/PowerQualityModal';
import AiAdvisorChatbot from './components/citizen/AiAdvisorChatbot';

// Admin components
import AdminOverview from './components/admin/AdminOverview';
import ComplaintsQueue from './components/admin/ComplaintsQueue';
import MasterSchedules from './components/admin/MasterSchedules';
import ConsumerDirectory from './components/admin/ConsumerDirectory';
import UrbanGisMap from './components/admin/UrbanGisMap';

// APIs
import {
  getLiveTelemetry,
  getBillForecast,
  getBudgetStatus,
  getComplaints,
  getAppointments,
  getNotifications,
  clearNotifications,
  getAdminConsumers
} from './services/api';

export default function App() {
  const { currentUser, currentPortal, setCurrentPortal } = useAuth();

  // Tab states
  const [citizenTab, setCitizenTab] = useState('overview'); // overview, complaints, appts, reports, history, tou-ev
  const [adminTab, setAdminTab] = useState('overview'); // overview, queue, schedules, consumers, gis-map

  // Simulator scenario
  const [scenario, setScenario] = useState('normal');

  // Modals & Panels
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [complaintModalData, setComplaintModalData] = useState({ isOpen: false, initial: null });
  const [activeMeetingToken, setActiveMeetingToken] = useState(null);
  const [isPowerQualityOpen, setIsPowerQualityOpen] = useState(false);

  // Data states
  const [telemetry, setTelemetry] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [consumers, setConsumers] = useState([]);

  // Telemetry 3-second live polling loop
  useEffect(() => {
    if (!currentUser) return;

    const fetchLive = () => {
      getLiveTelemetry()
        .then((data) => {
          setTelemetry(data);
          setScenario(data.scenario);
        })
        .catch((e) => console.error('Telemetry error:', e));
    };

    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Initial data loading
  const refreshAllData = () => {
    if (!currentUser) return;

    getBillForecast()
      .then(setForecast)
      .catch((e) => console.error('Forecast error:', e));

    getBudgetStatus()
      .then(setBudgetStatus)
      .catch((e) => console.error('Budget error:', e));

    getComplaints(true)
      .then(setComplaints)
      .catch((e) => console.error('Complaints error:', e));

    getComplaints(false)
      .then(setAllComplaints)
      .catch((e) => console.error('Admin Complaints error:', e));

    getAppointments()
      .then(setAppointments)
      .catch((e) => console.error('Appointments error:', e));

    getNotifications()
      .then(setNotifications)
      .catch((e) => console.error('Notifications error:', e));

    getAdminConsumers()
      .then(setConsumers)
      .catch((e) => console.error('Consumers error:', e));
  };

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <>
        <AuthScreen />
        <Toast />
      </>
    );
  }

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const handleClearNotifs = async () => {
    try {
      await clearNotifications();
      setNotifications([]);
    } catch (e) {}
  };

  const handleOpenDispute = (preset) => {
    setComplaintModalData({ isOpen: true, initial: preset });
  };

  return (
    <div className="app-container">
      {/* 1. IoT Lab Simulator Control Strip */}
      <SimulatorStrip
        currentScenario={scenario}
        onScenarioChanged={(newSc) => setScenario(newSc)}
      />

      {/* 2. Top Navigation Bar */}
      <Navbar
        onOpenDossier={() => setIsDossierOpen(true)}
        onToggleNotifs={() => setIsNotifsOpen((prev) => !prev)}
        unreadCount={unreadNotifs}
      />

      {/* 3. Secondary Portal Navigation Tabs */}
      <nav className="subnav">
        <div className="subnav-inner">
          {currentPortal === 'customer' ? (
            <>
              <button
                className={citizenTab === 'overview' ? 'active' : ''}
                onClick={() => setCitizenTab('overview')}
              >
                Dashboard Overview
              </button>
              <button
                className={citizenTab === 'complaints' ? 'active' : ''}
                onClick={() => setCitizenTab('complaints')}
              >
                Grievance Tickets ({complaints.length})
              </button>
              <button
                className={citizenTab === 'appts' ? 'active' : ''}
                onClick={() => setCitizenTab('appts')}
              >
                Appointments &amp; 4h Lock ({appointments.length})
              </button>
              <button
                className={citizenTab === 'reports' ? 'active' : ''}
                onClick={() => setCitizenTab('reports')}
              >
                AI Reports &amp; Audit Certificate
              </button>
              <button
                className={citizenTab === 'history' ? 'active' : ''}
                onClick={() => setCitizenTab('history')}
              >
                Historical Billing (6 Mo)
              </button>
              <button
                className={citizenTab === 'tou-ev' ? 'active' : ''}
                onClick={() => setCitizenTab('tou-ev')}
                style={citizenTab === 'tou-ev' ? {} : { background: 'rgba(16, 185, 129, 0.08)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}
              >
                ⚡ ToU Tariffs & EV Scheduler
              </button>
              <button
                style={{
                  background: 'rgba(226, 150, 35, 0.16)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  fontWeight: 700
                }}
                onClick={() =>
                  setActiveMeetingToken(
                    appointments.find((a) => a.mode === 'online')?.token || 'GP-50142'
                  )
                }
                title="Enter the live video consultation room with your CSR representative"
              >
                🎥 Meeting Portal
              </button>
            </>
          ) : (
            <>
              <button
                className={adminTab === 'overview' ? 'active' : ''}
                onClick={() => setAdminTab('overview')}
              >
                Urban Grid Hotspots
              </button>
              <button
                className={adminTab === 'queue' ? 'active' : ''}
                onClick={() => setAdminTab('queue')}
              >
                Complaint Queue &amp; Dispatch ({allComplaints.length})
              </button>
              <button
                className={adminTab === 'schedules' ? 'active' : ''}
                onClick={() => setAdminTab('schedules')}
              >
                Master Consultation Calendar
              </button>
              <button
                className={adminTab === 'consumers' ? 'active' : ''}
                onClick={() => setAdminTab('consumers')}
              >
                Registered Consumers ({consumers.length})
              </button>
              <button
                className={adminTab === 'gis-map' ? 'active' : ''}
                onClick={() => setAdminTab('gis-map')}
                style={adminTab === 'gis-map' ? {} : { background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}
              >
                🗺️ GIS Feeder & Outage Map
              </button>
              <button
                style={{
                  background: 'rgba(226, 150, 35, 0.16)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  fontWeight: 700
                }}
                onClick={() => setActiveMeetingToken('GP-50142')}
                title="Launch CSR video arbitration desk"
              >
                🎥 CSR Meeting Room
              </button>
            </>
          )}
        </div>
      </nav>

      {/* 4. Main Body Content */}
      <main className="container content-wrap">
        {currentPortal === 'customer' ? (
          <>
            {citizenTab === 'overview' && (
              <CitizenOverview
                telemetry={telemetry}
                forecast={forecast}
                budgetStatus={budgetStatus}
                onRefreshTelemetry={refreshAllData}
                onBudgetUpdated={refreshAllData}
                onTriggerDisputeModal={handleOpenDispute}
                onOpenPowerQuality={() => setIsPowerQualityOpen(true)}
              />
            )}
            {citizenTab === 'complaints' && (
              <ComplaintsTab
                complaints={complaints}
                onOpenNewGrievance={() =>
                  setComplaintModalData({ isOpen: true, initial: null })
                }
              />
            )}
            {citizenTab === 'appts' && (
              <AppointmentsTab
                appointments={appointments}
                onRefreshAppointments={refreshAllData}
                onJoinMeeting={(tok) => setActiveMeetingToken(tok)}
              />
            )}
            {citizenTab === 'reports' && <ReportsAuditTab />}
            {citizenTab === 'history' && <BillingHistoryTab />}
            {citizenTab === 'tou-ev' && <ToUEvSchedulerTab />}
          </>
        ) : (
          <>
            {adminTab === 'overview' && <AdminOverview />}
            {adminTab === 'queue' && (
              <ComplaintsQueue
                complaints={allComplaints}
                onRefreshComplaints={refreshAllData}
              />
            )}
            {adminTab === 'schedules' && (
              <MasterSchedules
                appointments={allComplaints}
                onJoinMeeting={(tok) => setActiveMeetingToken(tok)}
              />
            )}
            {adminTab === 'consumers' && (
              <ConsumerDirectory
                consumers={consumers}
                onRefreshConsumers={refreshAllData}
              />
            )}
            {adminTab === 'gis-map' && <UrbanGisMap />}
          </>
        )}
      </main>

      {/* 5. Modals and Notifications */}
      <NotificationDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onClearAll={handleClearNotifs}
      />

      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
      />

      <ComplaintModal
        isOpen={complaintModalData.isOpen}
        initialData={complaintModalData.initial}
        onClose={() =>
          setComplaintModalData({ isOpen: false, initial: null })
        }
        onComplaintCreated={refreshAllData}
      />

      {/* Virtual Consultation Meeting Room Portal */}
      {activeMeetingToken && (
        <MeetingPortal
          token={activeMeetingToken}
          onClose={() => setActiveMeetingToken(null)}
          onGrievanceResolved={refreshAllData}
        />
      )}

      {/* Power Quality Diagnostics Modal */}
      <PowerQualityModal
        isOpen={isPowerQualityOpen}
        onClose={() => setIsPowerQualityOpen(false)}
      />

      {/* Floating AI Energy Advisor Chatbot */}
      <AiAdvisorChatbot onNavigateTab={(tab) => setCitizenTab(tab)} />

      <Toast />
    </div>
  );
}
