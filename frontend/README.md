# FindSafe AI Frontend

React + Vite + TypeScript + Tailwind CSS application shell for FindSafe AI.

## Features

- **Design System**: Warm Khaki / Earth-tone public-safety palette with accessible tokens.
- **Application Shell**: Command Center navigation, responsive sidebar, and header profile area.
- **Authentication**: Prepared Supabase Auth integration with environment configuration validation.
- **GIS Preparedness**: React Leaflet Map container integration.
- **Modular Routing**: React Router v6 setup covering cases, searches, candidates, reports, map, demo mode, and settings.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase project details:
   ```bash
   cp .env.example .env
   ```

3. Run Vite development server:
   ```bash
   npm run dev
   ```

4. Open browser at [http://localhost:5173](http://localhost:5173).
