# FindSafe AI Backend

FastAPI application serving the core backend APIs, authentication middleware, and Supabase integration for FindSafe AI.

## Requirements

- Python 3.11+
- Virtual environment (`venv` or `conda`)

## Setup Instructions

1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

4. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Verify running instance:
   Navigate to [http://localhost:8000/api/health](http://localhost:8000/api/health) or API documentation at [http://localhost:8000/api/docs](http://localhost:8000/api/docs).
