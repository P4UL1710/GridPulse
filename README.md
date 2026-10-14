# GridPulse — Urban Smart Electricity Consumer Assistance & Energy Monitoring System

> **Full-Stack Academic Project: React + FastAPI + MongoDB Stack**  
> Aligned with the Teacher Problem Statement: *"Observe operational patterns in urban environments and demonstrate a very basic system for improvement."*  
> Based on the complete Software Requirements Specification (SRS FR1–FR14 & NFR1–NFR12) from `idealab.pdf`.

---

## 🌟 Executive Summary

**GridPulse** is an enterprise-grade smart energy management and urban decision-support platform designed for electrical distribution utilities and domestic consumers. It bridges the gap between smart-meter telemetry and urban utility service center operations.

### Key Highlights
1. **IoT Smart Meter Telemetry (FR2)**: Continuous 3-second streaming telemetry tracking active power (kW), line voltage (~230V), current (A), grid frequency (50Hz), and power factor with live animated sparkline.
2. **AI Slab Tariff Forecasting (FR3)**: Multi-slab tariff computation engine (0–100 kWh @ ₹4.50, 101–300 kWh @ ₹6.50, >300 kWh @ ₹8.20 + fixed charge ₹60 + 5% duty).
3. **Smart Bill Verification & 1-Click Dispute (FR9)**: Compares invoiced utility bills against AI telemetry projections. Discrepancies exceeding ±₹150 trigger alerts and generate official dispute evidence.
4. **Tokenized Grievance Tracking (FR5, FR6)**: Structured grievance registration with auto-generated tokens (`GP-XXXXX`) and real-time 4-step progress tracking (`Submitted` ➔ `Under Review` ➔ `In Progress` ➔ `Resolved`).
5. **Appointment Scheduling & 4-Hour Lock Rule (FR7, FR8)**: Enforces consultation mode locking within 4 hours of appointment slots and automated 2-hour reminder alerts.
6. **Urban Operations Analytics Console (FR12, FR13)**: Utility engineer console with sector demand hotspots, feeder load charts, complaint category doughnuts, and staff dispatch queues.
7. **Printable AI Energy Audit Certificate (FR10)**: Graphical load profiles with an official print-ready household audit certificate.
8. **6-Month Historical Billing & CSV Export (FR14)**: Audit trail table with variance tags and 1-click CSV download.

---

## 🏗️ Technology Stack Architecture

```
                  ┌────────────────────────────────────────┐
                  │       React + Vite Frontend (SPA)      │
                  │  • Vanilla CSS Design System Tokens    │
                  │  • Chart.js Interactive Analytics      │
                  │  • Web Audio API Synthesized Chimes    │
                  │  • 3-Second Live IoT Polling Loop      │
                  └───────────────────┬────────────────────┘
                                      │ HTTP / REST API
                                      ▼
                  ┌────────────────────────────────────────┐
                  │         FastAPI Backend (Python)       │
                  │  • Modular Routers (Auth, Billing,     │
                  │    Complaints, Telemetry, Admin)       │
                  │  • Multi-Slab Tariff Calculation Engine│
                  │  • 4-Hour Lock Rule Enforcement        │
                  │  • Interactive Swagger /docs Open-API  │
                  └───────────────────┬────────────────────┘
                                      │ Motor Async Driver
                                      ▼
                  ┌────────────────────────────────────────┐
                  │        MongoDB Database Layer          │
                  │  • Live MongoDB (mongodb://localhost)  │
                  │  • Resilient Async In-Memory Mock      │
                  │    Fallback (Runs 100% Out of the Box) │
                  │  • Collections: users, complaints,     │
                  │    telemetry, notifications, sectors   │
                  └────────────────────────────────────────┘
```

---

## 🚀 How to Run the Project

### Option A: 1-Click Runner (Windows)
Double-click [`start.bat`](file:///c:/Pawan/College/IdeaLab/start.bat) in the project root. This launches both the FastAPI backend and the React frontend simultaneously!

### Option B: Manual Launch

#### 1. Start FastAPI Backend:
```bash
cd backend
pip install -r requirements.txt
python run.py
```
*Backend runs on:* `http://localhost:8000`  
*Interactive Swagger API Docs:* `http://localhost:8000/docs`

#### 2. Start React Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on:* `http://localhost:5173`

---

## 🔑 Demo Accounts & Credentials

| Role | Email / ID | Password | Key Features Accessible |
| :--- | :--- | :--- | :--- |
| **Citizen (Consumer)** | `demo@gridpulse.app` | `demo1234` | Live IoT Meter, AI Forecast, Budget Planner, Discrepancy Dispute, Grievance Tokens, 4h Appointment Lock |
| **Utility Operations (Admin)** | `admin@gridpulse.app` | `admin` | Urban Grid Hotspots, Locality Peak Demands, Staff Dispatch Queue, Master Schedules, Consumer Directory |

> You can also click **"Use Demo Citizen (Asha Rao)"** or **"Sign in as Utility Admin"** on the login screen for 1-click access.

---

## 📋 SRS Traceability & Functional Requirements (FR1 – FR14)

| Req ID | Module / Feature | Backend Implementation | Frontend Implementation |
| :--- | :--- | :--- | :--- |
| **FR1** | **User Registration & Login** | `POST /api/auth/login`, `POST /api/auth/register` | [`AuthScreen.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/AuthScreen.jsx) with 1-click demo buttons |
| **FR2** | **Real-Time IoT Monitoring** | `GET /api/telemetry/live`, `POST /api/telemetry/scenario` | [`LiveMeterCard.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/citizen/LiveMeterCard.jsx) with 3s animated sparkline |
| **FR3** | **Electricity Bill Prediction** | `GET /api/billing/forecast` & `tariff_engine.py` | [`BillForecastCard.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/citizen/BillForecastCard.jsx) with slab breakdown |
| **FR4** | **Budget-Based Energy Suggestions** | `GET /api/billing/budget-status`, `PUT /api/auth/budget` | [`BudgetPlannerCard.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/citizen/BudgetPlannerCard.jsx) with appliance breakdown |
| **FR5** | **Complaint Registration** | `POST /api/complaints` with telemetry proof | [`ComplaintModal.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/ComplaintModal.jsx) with auto-attached proof |
| **FR6** | **Token Generation** | Auto-generates unique `GP-XXXXX` tokens | [`ComplaintsTab.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/citizen/ComplaintsTab.jsx) with 4-step stepper |
| **FR7** | **Appointment Scheduling** | `GET /api/appointments`, defaults to Offline | [`AppointmentsTab.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/citizen/AppointmentsTab.jsx) with mode switcher |
| **FR8** | **4h Lock & 2h CSR Alerts** | `PATCH /api/appointments/{token}/mode` (validates lock) | 4-hour locked state badge & 2-hour advance reminder banner |
| **FR9** | **Bill Comparison & Discrepancy** | `POST /api/billing/verify` (threshold ±₹150) | [`BillVerificationCard.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/citizen/BillVerificationCard.jsx) with 1-click dispute |
| **FR10** | **AI-Based Consumption Report** | `GET /api/reports/audit` | [`ReportsAuditTab.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/citizen/ReportsAuditTab.jsx) with printable certificate |
| **FR11** | **Citizen Dashboard** | Unified React SPA dashboard | [`CitizenOverview.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/citizen/CitizenOverview.jsx) |
| **FR12** | **Admin / Operations Dashboard** | `GET /api/admin/overview` | [`AdminOverview.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/admin/AdminOverview.jsx) with 3 analytical charts |
| **FR13** | **Complaint Tracking & Dispatch** | `PATCH /api/complaints/{token}/status`, `staff` | [`ComplaintsQueue.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/admin/ComplaintsQueue.jsx) with staff assignment |
| **FR14** | **Historical Data & Analytics** | `GET /api/billing/history` | [`BillingHistoryTab.jsx`](file:///c:/Pawan/College/IdeaLab/frontend/src/components/citizen/BillingHistoryTab.jsx) with CSV download |

---

## 🔬 Academic Literature Review & Citations

1. **Review of Smart Meter Data Analytics: Applications & Challenges** (*arXiv*)
2. **Energy Consumption Forecasting for Smart Meters** (*arXiv*)
3. **Forecasting Electricity Smart Meter Data Using Conditional KDE** (*arXiv*)
4. **The Energy Prediction Smart-Meter Dataset & Benchmarks** (*arXiv*)
5. **IoT Based Smart Energy Meter System Using Machine Learning** (*SAGE Journals*)
6. **AI-Assisted Automatic Billing & Metering System Design** (*ScienceDirect*)
7. **IoT Smart Meter Data Analysis Using ML Classifiers** (*IJERST*)
8. **The Impact of Real-Time & Disaggregated Energy Feedback** (*SSRN*)
9. **Smart Energy Forecasting using IoT, ML & Web App** (*IRE Journals*)
10. **Smart Energy System with Predictive Billing (VoltEdge)** (*SSRN*)
