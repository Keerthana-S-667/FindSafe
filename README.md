# FindSafe AI

**Privacy-Conscious Missing Person Detection, Matching & Reunification Platform**

FindSafe AI is an authorized public-safety platform designed to assist law enforcement and investigation teams in locating missing persons using evidence-based visual matching, time/location analysis, and privacy-first database architecture.

> **Current Project Status: Phase 1 Completed**  
> *Phase 1 establishes the application foundation, shell navigation, Supabase connectivity, and API contracts. AI/CV modules (YOLO, ByteTrack, OSNet) are implemented in subsequent phases.*

---

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Axios, Lucide React, React Leaflet
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic (pydantic-settings), SQLAlchemy, httpx
- **Database & Cloud**: Supabase PostgreSQL, Supabase Storage, Supabase Auth

---

## System Architecture

```
                  FINDSAFE AI
                       |
             ┌─────────┴─────────┐
             |                   |
        FRONTEND              BACKEND
             |                   |
     React + Vite           FastAPI
     TypeScript             Python
     Tailwind CSS               |
             |                   |
             └──────────┬────────┘
                        |
                     Supabase
               ┌────────┼────────┐
               |        |        |
           PostgreSQL Storage   Auth
```

For complete architectural details, see [`docs/architecture.md`](file:///c:/Users/skeer/OneDrive/Desktop/FindSafe/docs/architecture.md).

---

## Project Structure

```
FINDSAFE-AI/
├── frontend/             # React + Vite + TypeScript + Tailwind UI Shell
├── backend/              # FastAPI Python Backend Service
├── docs/                 # System Architecture & Database Specifications
│   ├── architecture.md
│   ├── database.md
│   └── development-phases.md
├── .gitignore
└── README.md
```

---

## Quick Start Guide

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run FastAPI backend server
uvicorn app.main:app --reload --port 8000
```

Verify backend health at: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env

# Run Vite dev server
npm run dev
```

Open application shell at: [http://localhost:5173](http://localhost:5173)

---

## Supabase Configuration

1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. Configure environment variables in `frontend/.env` and `backend/.env`:

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend (`backend/.env`):**
```env
APP_NAME=FindSafe AI
ENVIRONMENT=development
API_PREFIX=/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
```

> **Security Note**: The `SUPABASE_SERVICE_ROLE_KEY` is reserved strictly for backend administration and is never exposed to the frontend bundle.

---

## Development Phases & Roadmap

1. **Phase 1 (Completed)**: Core Architecture & Application Shell Foundation
2. **Phase 2**: Authorized Case Management & Supabase Storage Integration
3. **Phase 3**: AI/CV Vision Pipeline (YOLO + ByteTrack + OSNet)
4. **Phase 4**: Multi-Modal Evidence Fusion & Match Verification Queue
5. **Phase 5**: Audit Compliance, Reporting & Production Deployment

---

## Privacy & Security Principles

- **Privacy by Design**: Search operations operate strictly on non-sensitive visual attributes and reference photographs.
- **Authorized Use**: Access restricted to verified operators with audit logging.
- **Data Protection**: Supabase Row-Level Security (RLS) policies isolate case files.
