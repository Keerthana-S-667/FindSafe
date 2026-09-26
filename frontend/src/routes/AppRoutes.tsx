import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Lazy-loaded route pages for code-splitting & lightweight initial bundle
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CasesPage = lazy(() => import('../pages/CasesPage').then(m => ({ default: m.CasesPage })));
const NewCasePage = lazy(() => import('../pages/NewCasePage').then(m => ({ default: m.NewCasePage })));
const CaseDetailPage = lazy(() => import('../pages/CaseDetailPage').then(m => ({ default: m.CaseDetailPage })));
const InvestigationWorkspacePage = lazy(() => import('../pages/InvestigationWorkspacePage').then(m => ({ default: m.InvestigationWorkspacePage })));
const SearchCrowdPage = lazy(() => import('../pages/SearchCrowdPage').then(m => ({ default: m.SearchCrowdPage })));
const ProcessingPage = lazy(() => import('../pages/ProcessingPage').then(m => ({ default: m.ProcessingPage })));
const SearchRecordsPage = lazy(() => import('../pages/SearchRecordsPage').then(m => ({ default: m.SearchRecordsPage })));
const SearchEverywherePage = lazy(() => import('../pages/SearchEverywherePage').then(m => ({ default: m.SearchEverywherePage })));
const ReportsPage = lazy(() => import('../pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const InvestigationReplayPage = lazy(() => import('../pages/InvestigationReplayPage').then(m => ({ default: m.InvestigationReplayPage })));
const DecisionBoardPage = lazy(() => import('../pages/DecisionBoardPage').then(m => ({ default: m.DecisionBoardPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-100 flex items-center justify-center p-6">
          <LoadingSpinner label="Loading application module..." />
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="operations" element={<Navigate to="/dashboard" replace />} />
          <Route path="command-center/operations" element={<Navigate to="/dashboard" replace />} />
          <Route path="search-sessions/:sessionId/replay" element={<InvestigationReplayPage />} />
          <Route path="cases/:caseId/replay" element={<InvestigationReplayPage />} />
          <Route path="cases/:caseId/decision-board" element={<DecisionBoardPage />} />
          
          {/* Case Management Routes */}
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/new" element={<NewCasePage />} />
          <Route path="cases/:caseId" element={<CaseDetailPage />} />
          <Route path="cases/:caseId/investigation" element={<InvestigationWorkspacePage />} />
          
          {/* Search Routes */}
          <Route path="search/crowd" element={<SearchCrowdPage />} />
          <Route path="search/crowd/:sessionId" element={<ProcessingPage />} />
          <Route path="search/records" element={<SearchRecordsPage />} />
          <Route path="search/everywhere" element={<SearchEverywherePage />} />
          
          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />

          {/* Legacy redirects */}
          <Route path="candidates/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="map" element={<Navigate to="/dashboard" replace />} />
          <Route path="demo*" element={<Navigate to="/dashboard" replace />} />
          <Route path="scenario-center" element={<Navigate to="/dashboard" replace />} />
          <Route path="settings" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

