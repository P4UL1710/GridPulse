const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeader() {
  const user = localStorage.getItem('gp_user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return { 'Authorization': `Bearer ${parsed.email}` };
    } catch (e) {}
  }
  return { 'Authorization': 'Bearer demo@gridpulse.app' };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const data = await res.json();
        if (data && data.detail) {
          errorMsg = data.detail;
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

// Auth APIs
export const authLogin = (email, password) => 
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const authRegister = (userData) => 
  request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });

export const authGetMe = () => 
  request('/auth/me');

export const authUpdateBudget = (low, high) => 
  request('/auth/budget', { method: 'PUT', body: JSON.stringify({ low: parseFloat(low), high: parseFloat(high) }) });

// Telemetry APIs
export const getLiveTelemetry = () => 
  request('/telemetry/live');

export const setSimulatorScenario = (scenario) => 
  request('/telemetry/scenario', { method: 'POST', body: JSON.stringify({ scenario }) });

export const getTelemetryHistory = () => 
  request('/telemetry/history');

// Billing APIs
export const getBillForecast = () => 
  request('/billing/forecast');

export const verifyBill = (actual_bill) => 
  request('/billing/verify', { method: 'POST', body: JSON.stringify({ actual_bill: parseFloat(actual_bill) }) });

export const getBudgetStatus = () => 
  request('/billing/budget-status');

export const getBillingHistory = () => 
  request('/billing/history');

// Complaints APIs
export const getComplaints = (mineOnly = true, status = null, locality = null) => {
  const params = new URLSearchParams();
  params.set('mine_only', mineOnly ? 'true' : 'false');
  if (status) params.set('status', status);
  if (locality) params.set('locality', locality);
  return request(`/complaints?${params.toString()}`);
};

export const createComplaint = (data) => 
  request('/complaints', { method: 'POST', body: JSON.stringify(data) });

export const updateComplaintStatus = (token, status) => 
  request(`/complaints/${token}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const updateComplaintStaff = (token, assigned_staff) => 
  request(`/complaints/${token}/staff`, { method: 'PATCH', body: JSON.stringify({ assigned_staff }) });

// Appointments APIs
export const getAppointments = () => 
  request('/appointments');

export const updateAppointmentMode = (token, mode) => 
  request(`/appointments/${token}/mode`, { method: 'PATCH', body: JSON.stringify({ mode }) });

export const simulateUpcomingAppointment = () => 
  request('/appointments/simulate', { method: 'POST' });

// Admin Ops APIs
export const getAdminOverview = () => 
  request('/admin/overview');

export const getAdminConsumers = () => 
  request('/admin/consumers');

export const simulateConsumer = () => 
  request('/admin/simulate-consumer', { method: 'POST' });

export const seedMoreComplaints = () => 
  request('/admin/seed-more', { method: 'POST' });

// Notifications APIs
export const getNotifications = () => 
  request('/notifications');

export const createNotification = (text) => 
  request('/notifications', { method: 'POST', body: JSON.stringify({ text }) });

export const clearNotifications = () => 
  request('/notifications', { method: 'DELETE' });

// Reports APIs
export const getAuditReport = () => 
  request('/reports/audit');

// Meeting Portal APIs
export const getMeetingRoom = (token) => 
  request(`/meetings/${token}`);

export const sendMeetingMessage = (token, sender, role, text) => 
  request(`/meetings/${token}/messages`, {
    method: 'POST',
    body: JSON.stringify({ sender, role, text })
  });

export const resolveMeetingGrievance = (token, verdict, rebate_amount, resolution_notes) => 
  request(`/meetings/${token}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ verdict, rebate_amount: parseFloat(rebate_amount || 0), resolution_notes })
  });

// Smart Grid & Solar APIs
export const toggleSolar = (enabled) => 
  request('/telemetry/solar-toggle', { method: 'POST', body: JSON.stringify({ enabled }) });

export const getToUSchedule = () => 
  request('/smartgrid/tou');

export const calculateEvSchedule = (params) => 
  request('/smartgrid/ev-schedule', { method: 'POST', body: JSON.stringify(params) });

export const getGisDistributionMap = () => 
  request('/smartgrid/gis-map');

export const dispatchGisCrew = (feeder_id) => 
  request(`/smartgrid/gis-dispatch/${feeder_id}`, { method: 'POST' });

export const getPowerQualityDiagnostics = () => 
  request('/smartgrid/power-quality');

export const getAiEnergyAdvisor = (query, consumer_context = {}) => 
  request('/smartgrid/ai-advisor', { method: 'POST', body: JSON.stringify({ query, consumer_context }) });

export const getSustainabilityLeaderboard = () => 
  request('/smartgrid/leaderboard');
