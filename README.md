# 🔍 FindSafe AI — Intelligent Missing Person Search & Investigation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?logo=supabase)](https://supabase.com)
[![YOLOv8](https://img.shields.io/badge/Computer_Vision-YOLOv8-FF6F00.svg)](https://ultralytics.com)

**FindSafe AI** is an advanced, privacy-conscious public safety investigation platform designed to assist authorized teams, emergency response personnel, and law enforcement in rapidly locating and reuniting missing persons. 

By combining **multi-camera CCTV computer vision (YOLOv8 + Re-ID tracking)**, **institutional database vector matching**, and **multi-modal evidence synthesis**, FindSafe AI accelerates critical golden-hour search operations.

---

## 🌟 Key Capabilities

### 1. 📹 Multi-Camera CCTV Crowd Search
- **YOLOv8 Detection & Tracking**: Frame-by-frame person detection, bounding-box extraction, and camera-to-camera tracking.
- **Visual Re-Identification (Re-ID)**: Color histogram matching and visual feature scoring against reference case photos.
- **Multi-Angle Support**: Simultaneously process multiple CCTV video feeds (overhead, side-angle, entrance/exit cameras) to generate correlated candidate sightings.

### 2. 📋 Institutional Records Search
- **Multi-Source Ingestion**: Query records across shelter registries, hospital admissions, transit networks, and missing person databases.
- **Attribute & Semantic Vector Matching**: Search by clothing attributes, age group, physical descriptors, and last-seen locations.

### 3. 🌐 Unified "Search Everywhere"
- **Cross-Source Evidence Synthesis**: Fuses live CCTV candidate detections with institutional records into a prioritized evidence queue.
- **Corroboration Confidence Scoring**: Computes cross-source confidence scores (0–100%) based on visual similarity, time-window proximity, and attribute consistency.

### 4. 🧭 Operations Center & Investigation Workspace
- **Real-Time Timeline Replay**: Interactive frame-by-frame replay of camera sightings with time stamps and camera identifiers.
- **Evidence Decision Board**: Human-in-the-loop review workflow for marking candidate sightings as *Verified*, *Under Review*, or *Dismissed*.

### 5. 📄 Official PDF Investigation Reports
- **Automated Case Dossier Generation**: Instant generation of official multi-page PDF case reports.
- **Complete Evidence Breakdown**: Includes profile details, CCTV candidate detections, institutional records matches, and chain of custody documentation.

---

## 🏗️ System Architecture

```
                                  FINDSAFE AI PLATFORM
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
        FRONTEND (UI/UX)                                         BACKEND (API & AI)
    ┌───────────────────────────┐                             ┌───────────────────────────┐
    │  React 18 + TypeScript    │                             │  FastAPI (Python 3.11+)   │
    │  Vite Dev & Bundler       │                             │  YOLOv8 Computer Vision   │
    │  Tailwind CSS             │◄────────── REST ───────────►│  Re-ID Matching Engine    │
    │  Lucide Icons + Leaflet   │          (JSON/HTTP)        │  ReportLab PDF Synthesizer│
    └─────────────┬─────────────┘                             └─────────────┬─────────────┘
                  │                                                         │
                  └─────────────────────────┬───────────────────────────────┘
                                            │
                                            ▼
                                  SUPABASE CLOUD / DB
                      ┌───────────────────────────────────────────┐
                      │  • PostgreSQL with Row Level Security     │
                      │  • Supabase Auth & Session Management     │
                      │  • Storage Buckets (Case Media & Reports) │
                      │  • Relational Schema (11 Migration Steps) │
                      └───────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
FindSafe/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── ai/               # Computer vision, YOLOv8 & Re-ID services
│   │   ├── api/routes/       # REST endpoints (cases, video, records, reports)
│   │   ├── core/             # Configuration & security settings
│   │   ├── database/         # Supabase client & DB abstractions
│   │   ├── models/           # Pydantic & domain models
│   │   └── services/         # Business logic (reports, tracking, matching)
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend configuration template
│
├── frontend/                 # React 18 + Vite TypeScript application
│   ├── src/
│   │   ├── components/       # Reusable UI components & layouts
│   │   ├── pages/            # View pages (Dashboard, Cases, Search, Reports)
│   │   ├── routes/           # Protected routes & navigation
│   │   ├── services/         # Axios API clients & Supabase auth
│   │   └── styles/           # Tailwind CSS styles
│   ├── package.json          # Frontend dependencies
│   └── .env.example          # Frontend configuration template
│
├── supabase/
│   └── migrations/           # 11 SQL migrations for database schema
│
├── demo-data/                # Sample datasets for rapid testing & evaluation
├── docs/                     # Architecture & database documentation
├── .gitignore                # Comprehensive Git protection rules
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.10+)
- **Supabase** account (Free tier or local instance)

---

### 1. Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Fill in your SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env

# 5. Start the FastAPI backend server
uvicorn app.main:app --reload --port 8000
```

Backend API will be live at: **[http://localhost:8000](http://localhost:8000)**  
Interactive Swagger Docs: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 2. Frontend Setup

```bash
# 1. Navigate to frontend directory (in a new terminal)
cd frontend

# 2. Install Node dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in VITE_API_BASE_URL, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY in .env

# 4. Start Vite development server
npm run dev
```

Open your browser at: **[http://localhost:5173](http://localhost:5173)**

---

## 🗄️ Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migration scripts in order from [`supabase/migrations/`](file:///c:/Users/skeer/OneDrive/Desktop/FindSafe/supabase/migrations):
   - `20260926000000_findsafe_schema.sql` (Base schema & cases)
   - `20260926010000_findsafe_phase4_schema.sql` through `20260926100000_findsafe_phase14_schema.sql`
3. Create a Supabase Storage bucket named `findsafe-media` (Public or Authenticated).

---

## 🛡️ Privacy, Security & Compliance

- **Human-in-the-Loop Decisions**: AI outputs are framed as investigatory leads. Final identification requires verification by authorized human investigators.
- **Privacy by Design**: Operates on non-biometric visual descriptors (clothing colors, spatial-temporal sequence) rather than biometric facial templates.
- **Row Level Security (RLS)**: Case data is secured with Supabase RLS policies to restrict unauthorized data access.
- **Protected Secrets**: Local `.env` files, API keys, and temporary uploads are strictly excluded from version control.

---

## 📄 License

This project is licensed under the **MIT License**.
