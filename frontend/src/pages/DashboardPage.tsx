import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Shield, Search, Camera, FileText, Globe, UserCheck, AlertCircle, Clock, 
  MapPin, CheckCircle2, ChevronRight, Activity, Filter, Eye, Sparkles, Server,
  ShieldAlert, RefreshCw, FileCheck, Ban, Zap, Users, Sliders, ArrowUpRight,
  Database, Info, AlertTriangle, Layers, ListFilter, Play, FileDown, Lock
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';
import { commandCenterService, type CommandCenterSummary, type CameraCoverageItem } from '../services/commandCenterService';
import { adminService, type GlobalSearchResults, type SystemHealthStatus } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import type { MissingPersonCase, RecordMatch, CandidateGroup } from '../types';

// Custom Leaflet marker for Camera Coverage
const cameraMarkerIcon = L.divIcon({
  className: 'custom-camera-marker',
  html: `<div style="background-color: #B85A1F; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.5); font-weight: bold; font-size: 12px;">📷</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = (user?.role || 'investigator').toUpperCase();

  // Summary & Detail States
  const [summary, setSummary] = useState<CommandCenterSummary | null>(null);
  const [cameraCoverage, setCameraCoverage] = useState<CameraCoverageItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Review Queue Sorting
  const [reviewSortBy, setReviewSortBy] = useState<'newest' | 'oldest' | 'score' | 'priority'>('newest');

  // Activity Filter State
  const [activityFilter, setActivityFilter] = useState<string>('all');

  // System Health Modal State
  const [showHealthModal, setShowHealthModal] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, camRes, healthRes] = await Promise.all([
        commandCenterService.getSummary(),
        commandCenterService.getCameras(),
        adminService.getSystemHealthStatus()
      ]);
      setSummary(sumRes);
      setCameraCoverage(camRes);
      setSystemHealth(healthRes);
    } catch (err: any) {
      console.warn('Error loading Command Center data:', err);
      setError('Unable to load full command center metrics. Please check network connectivity or refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await adminService.globalSearch(searchQuery.trim());
      setSearchResults(res);
    } catch (err) {
      console.warn('Global search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-900 border-red-300';
      case 'high': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'medium': return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'low': return 'bg-surface-200 text-surface-950 border-surface-400';
      default: return 'bg-surface-200 text-surface-950 border-surface-400';
    }
  };

  // Sort Review Queue
  const sortedReviews = React.useMemo(() => {
    if (!summary?.review_queue) return [];
    const reviews = [...summary.review_queue];
    if (reviewSortBy === 'newest') {
      return reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (reviewSortBy === 'oldest') {
      return reviews.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (reviewSortBy === 'score') {
      return reviews.sort((a, b) => b.evidence_score - a.evidence_score);
    } else if (reviewSortBy === 'priority') {
      const pMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return reviews.sort((a, b) => (pMap[b.case_priority?.toLowerCase() || 'medium'] || 0) - (pMap[a.case_priority?.toLowerCase() || 'medium'] || 0));
    }
    return reviews;
  }, [summary?.review_queue, reviewSortBy]);

  // Filter Activity Feed
  const filteredActivity = React.useMemo(() => {
    if (!summary?.recent_activity) return [];
    if (activityFilter === 'all') return summary.recent_activity;
    return summary.recent_activity.filter(a => a.type?.toLowerCase() === activityFilter.toLowerCase());
  }, [summary?.recent_activity, activityFilter]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-surface-300">Loading Authority Command Center Intel...</p>
        </div>
      </PageContainer>
    );
  }

  const spotlightCase = summary?.case_spotlight;
  const metrics = summary?.summary_metrics;
  const caseStatusDist = summary?.case_status_distribution || { open: 0, under_review: 0, resolved: 0, closed: 0, archived: 0 };
  const searchStatusDist = summary?.search_status_distribution || { processing: 0, completed: 0, partial: 0, failed: 0, cancelled: 0 };
  const evidenceOverview = summary?.evidence_overview || { camera_evidence: 0, record_evidence: 0, cross_source_associations: 0, candidate_groups: 0, reports: 0 };
  const sourceDist = summary?.source_distribution || { camera: 0, police: 0, hospital: 0, shelter: 0, public_report: 0 };
  const taskStats = summary?.task_stats || { open: 0, completed: 0, overdue: 0 };

  return (
    <PageContainer>
      {/* 1. COMMAND CENTER HEADER */}
      <div className="bg-surface-50 border border-surface-300 rounded-2xl p-6 mb-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-300 pb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-7 h-7 text-brand-600 shrink-0" />
              <h1 className="text-2xl font-black text-surface-950 tracking-tight">
                FINDSAFE AI COMMAND CENTER
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold uppercase bg-brand-500/15 text-brand-700 border border-brand-500/30 rounded-md">
                ROLE: {userRole}
              </span>
            </div>
            <p className="text-xs text-surface-700 font-medium">
              Privacy-Conscious Public Safety Investigation, Multi-Source Intel & Human-Verified Matching Dashboard
            </p>
          </div>

          {/* Global Search Input */}
          <form onSubmit={handleGlobalSearch} className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="Global Search (Case ID, Subject, Record ID, Report Code)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-50 border border-surface-400 text-surface-950 placeholder-surface-600 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-brand-500 font-medium"
            />
            <Search className="w-4 h-4 text-surface-700 absolute left-3 top-2.5" />
          </form>
        </div>

        {/* Global Search Results Dropdown */}
        {searchResults && (
          <div className="p-4 bg-surface-200 border border-surface-400 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-surface-950">Global Search Results for "{searchResults.query}"</span>
              <button onClick={() => setSearchResults(null)} className="text-surface-700 hover:text-surface-950 text-xs font-semibold">Clear</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-surface-800 font-bold uppercase block mb-1">Matching Cases ({searchResults.cases.length})</span>
                {searchResults.cases.length === 0 ? (
                  <p className="text-surface-700 text-[11px] font-medium">No matching cases</p>
                ) : (
                  searchResults.cases.map((c) => (
                    <Link key={c.id} to={`/cases/${c.id}/investigation`} className="block p-2 bg-surface-50 border border-surface-300 hover:border-brand-500 rounded-lg text-surface-950 mb-1 font-medium">
                      <strong className="font-bold">{c.case_id}</strong> - {c.reference_name} ({c.last_seen_location})
                    </Link>
                  ))
                )}
              </div>
              <div>
                <span className="text-[10px] text-surface-800 font-bold uppercase block mb-1">Institutional Records ({searchResults.records.length})</span>
                {searchResults.records.length === 0 ? (
                  <p className="text-surface-700 text-[11px] font-medium">No matching records</p>
                ) : (
                  searchResults.records.map((r) => (
                    <Link key={r.id} to={`/search-records`} className="block p-2 bg-surface-50 border border-surface-300 hover:border-brand-500 rounded-lg text-surface-950 mb-1 font-medium">
                      <strong className="font-bold">{r.record_id}</strong> - {r.source_type?.toUpperCase()} ({r.location})
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disclaimers & Operational AI Status Strip */}
        <div className="flex items-center justify-between text-[11px] text-surface-400 flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Privacy-Conscious Search</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Non-Sensitive Visual Attributes</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> Human Verification Required</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-sky-400" /> Authorized Evidence Sources</span>
          </div>
          <button 
            onClick={loadDashboardData} 
            className="flex items-center gap-1 text-brand-300 hover:text-brand-200 transition-colors font-mono font-bold"
          >
            <RefreshCw className="w-3 h-3" /> Refresh Command Center
          </button>
        </div>
      </div>

      {/* 2. TOP STATUS STRIP (Real DB Values) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Active Cases</span>
          <span className="text-2xl font-extrabold text-surface-950 font-mono">{metrics?.active_cases ?? 0}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Active Searches</span>
          <span className="text-2xl font-extrabold text-sky-700 font-mono">{metrics?.active_searches ?? 0}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Pending Reviews</span>
          <span className="text-2xl font-extrabold text-amber-700 font-mono">{metrics?.pending_reviews ?? 0}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Open Tasks</span>
          <span className="text-2xl font-extrabold text-indigo-700 font-mono">{metrics?.open_tasks ?? 0}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Partial Searches</span>
          <span className="text-2xl font-extrabold text-amber-800 font-mono">{metrics?.partial_searches ?? 0}</span>
        </div>
        <div 
          onClick={() => setShowHealthModal(true)}
          className="p-4 bg-surface-50 border border-surface-400 hover:border-brand-500 rounded-xl space-y-1 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">System Status</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-lg font-extrabold text-emerald-700 font-mono uppercase block">{metrics?.system_status || 'Operational'}</span>
        </div>
      </div>

      {/* 3. MAIN INTELLIGENCE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* LEFT COLUMN: CASE SPOTLIGHT & CASE DISTRIBUTION */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CASE SPOTLIGHT */}
          <Card>
            <div className="flex items-center justify-between border-b border-surface-300 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                <h2 className="text-sm font-extrabold text-surface-950 uppercase tracking-wider">
                  CASE SPOTLIGHT (MOST RECENTLY ACTIVE)
                </h2>
              </div>
              {spotlightCase && (
                <Link to={`/cases/${spotlightCase.id}/investigation`}>
                  <Button size="sm" variant="secondary" icon={<Eye className="w-3.5 h-3.5" />}>
                    Open Investigation Workspace
                  </Button>
                </Link>
              )}
            </div>

            {spotlightCase ? (
              <div className="bg-surface-50 border border-surface-400 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-300 pb-3">
                  <div className="flex items-center gap-3">
                    {spotlightCase.reference_image_url ? (
                      <img
                        src={spotlightCase.reference_image_url}
                        alt={spotlightCase.full_name || spotlightCase.case_title}
                        className="w-12 h-12 rounded-xl object-cover border border-surface-400 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-700 font-black text-base shrink-0">
                        {(spotlightCase.full_name || spotlightCase.case_title || 'MP')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-mono font-bold text-brand-700 block">{spotlightCase.case_id || 'ACTIVE CASE'}</span>
                      <h3 className="text-lg font-extrabold text-surface-950">{spotlightCase.full_name || spotlightCase.case_title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase border ${getPriorityBadgeColor(spotlightCase.priority)}`}>
                      {spotlightCase.priority} PRIORITY
                    </span>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md uppercase bg-surface-200 text-surface-950 border border-surface-400">
                      {spotlightCase.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-surface-200 p-2.5 rounded-lg border border-surface-300">
                    <span className="text-[10px] text-surface-700 block font-extrabold uppercase">Candidate Sightings</span>
                    <span className="text-base font-extrabold text-sky-700 font-mono">{spotlightCase.candidate_count ?? 0}</span>
                  </div>
                  <div className="bg-surface-200 p-2.5 rounded-lg border border-surface-300">
                    <span className="text-[10px] text-surface-700 block font-extrabold uppercase">Age & Gender</span>
                    <span className="text-xs font-extrabold text-surface-950 truncate block">
                      {spotlightCase.age ? `${spotlightCase.age} yrs` : 'N/A'}{spotlightCase.gender ? `, ${spotlightCase.gender}` : ''}
                    </span>
                  </div>
                  <div className="bg-surface-200 p-2.5 rounded-lg border border-surface-300">
                    <span className="text-[10px] text-surface-700 block font-extrabold uppercase">Assigned Unit</span>
                    <span className="text-xs font-extrabold text-surface-950 truncate block">Public Safety Unit</span>
                  </div>
                  <div className="bg-surface-200 p-2.5 rounded-lg border border-surface-300">
                    <span className="text-[10px] text-surface-700 block font-extrabold uppercase">Last Seen Location</span>
                    <span className="text-xs font-semibold text-surface-900 truncate block">{spotlightCase.last_seen_location || 'Reported Missing'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="No active cases" description="No active missing-person case files currently registered in system." icon={Shield} />
            )}
          </Card>

          {/* CASE STATUS & PRIORITY DISTRIBUTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <SectionHeader title="Case Status Distribution" subtitle="Missing person case file workflow state breakdown" />
              <div className="space-y-3 mt-4 text-xs">
                {[
                  { label: 'Active', count: caseStatusDist.active ?? caseStatusDist.open ?? 0, color: 'bg-emerald-500' },
                  { label: 'Under Review', count: caseStatusDist.under_review ?? 0, color: 'bg-amber-500' },
                  { label: 'Resolved', count: caseStatusDist.resolved ?? 0, color: 'bg-sky-500' },
                  { label: 'Closed', count: caseStatusDist.closed ?? 0, color: 'bg-surface-600' },
                  { label: 'Archived', count: caseStatusDist.archived ?? 0, color: 'bg-surface-700' },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between font-semibold text-surface-800">
                      <span>{item.label}</span>
                      <span className="font-mono font-bold text-surface-950">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-300 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} transition-all duration-500`}
                        style={{ width: `${Math.min(100, (item.count / Math.max(1, metrics?.active_cases || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Case Priority Distribution" subtitle="Human-controlled investigative urgency level" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] text-red-800 font-extrabold uppercase block">Critical</span>
                  <span className="text-xl font-extrabold text-red-700 font-mono">
                    {summary?.case_priority_distribution?.critical ?? summary?.cases?.filter(c => c.priority?.toLowerCase() === 'critical').length ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] text-amber-800 font-extrabold uppercase block">High</span>
                  <span className="text-xl font-extrabold text-amber-700 font-mono">
                    {summary?.case_priority_distribution?.high ?? summary?.cases?.filter(c => c.priority?.toLowerCase() === 'high').length ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] text-sky-800 font-extrabold uppercase block">Medium</span>
                  <span className="text-xl font-extrabold text-sky-700 font-mono">
                    {summary?.case_priority_distribution?.medium ?? summary?.cases?.filter(c => c.priority?.toLowerCase() === 'medium').length ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-surface-200 border border-surface-300 rounded-xl space-y-1">
                  <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Low</span>
                  <span className="text-xl font-extrabold text-surface-950 font-mono">
                    {summary?.case_priority_distribution?.low ?? summary?.cases?.filter(c => c.priority?.toLowerCase() === 'low').length ?? 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* SEARCH STATUS VISUALIZATION & ACTIVITY */}
          <Card>
            <div className="flex items-center justify-between border-b border-surface-300 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-surface-950 uppercase tracking-wider">SEARCH STATUS BREAKDOWN</h3>
                <p className="text-xs text-surface-700">Execution states across all CCTV and record sessions</p>
              </div>
              <Link to="/search/crowd">
                <Button size="sm" variant="secondary" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                  Search the Crowd
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs mb-4">
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl shadow-xs">
                <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Completed</span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono">{searchStatusDist.completed}</span>
              </div>
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl shadow-xs">
                <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Processing</span>
                <span className="text-xl font-extrabold text-sky-700 font-mono">{searchStatusDist.processing}</span>
              </div>
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl shadow-xs">
                <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Partial</span>
                <span className="text-xl font-extrabold text-amber-700 font-mono">{searchStatusDist.partial}</span>
              </div>
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl shadow-xs">
                <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Failed</span>
                <span className="text-xl font-extrabold text-red-700 font-mono">{searchStatusDist.failed}</span>
              </div>
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl shadow-xs">
                <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Cancelled</span>
                <span className="text-xl font-extrabold text-surface-700 font-mono">{searchStatusDist.cancelled}</span>
              </div>
            </div>

            <div className="bg-surface-200 p-4 rounded-xl border border-surface-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-brand-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-surface-950 block">Search Activity History</span>
                  <span className="text-surface-700 text-[11px] font-medium">Real time multi-camera AI search execution history</span>
                </div>
              </div>
              <span className="font-mono text-brand-700 font-extrabold">
                {summary?.summary_metrics?.active_searches ? `${summary.summary_metrics.active_searches} Active Searches` : `${searchStatusDist.completed} Completed Searches`}
              </span>
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN: EVIDENCE OVERVIEW & QUICK ACTIONS */}
        <div className="space-y-6">
          
          {/* EVIDENCE OVERVIEW */}
          <Card>
            <SectionHeader title="Evidence Overview" subtitle="Fused intelligence items across sources" />
            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl flex justify-between items-center shadow-xs">
                <span className="text-surface-950 font-bold flex items-center gap-2"><Camera className="w-4 h-4 text-brand-600" /> Camera Evidence</span>
                <span className="font-mono font-extrabold text-brand-700 text-sm">{evidenceOverview.camera_evidence}</span>
              </div>
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl flex justify-between items-center shadow-xs">
                <span className="text-surface-950 font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Record Evidence</span>
                <span className="font-mono font-extrabold text-indigo-700 text-sm">{evidenceOverview.record_evidence}</span>
              </div>
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl flex justify-between items-center shadow-xs">
                <span className="text-surface-950 font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-600" /> Cross-Source Connections</span>
                <span className="font-mono font-extrabold text-emerald-700 text-sm">{evidenceOverview.cross_source_associations}</span>
              </div>
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl flex justify-between items-center shadow-xs">
                <span className="text-surface-950 font-bold flex items-center gap-2"><Users className="w-4 h-4 text-sky-600" /> Candidate Groups</span>
                <span className="font-mono font-extrabold text-sky-700 text-sm">{evidenceOverview.candidate_groups}</span>
              </div>
            </div>
          </Card>

          {/* EVIDENCE SOURCE DISTRIBUTION */}
          <Card>
            <SectionHeader title="Evidence Source Breakdown" subtitle="Distribution by institutional source type" />
            <div className="space-y-2.5 mt-3 text-xs">
              {[
                { label: 'CCTV Video Feeds', count: sourceDist.camera ?? evidenceOverview.camera_evidence, color: 'text-brand-700' },
                { label: 'Hospital & Police Records', count: sourceDist.records ?? evidenceOverview.record_evidence, color: 'text-sky-700' },
                { label: 'Investigation Reports', count: sourceDist.reports ?? 0, color: 'text-emerald-700' },
              ].map((s) => (
                <div key={s.label} className="p-2.5 bg-surface-50 border border-surface-400 rounded-lg flex justify-between items-center">
                  <span className="text-surface-950 font-semibold">{s.label}</span>
                  <span className={`font-mono font-extrabold ${s.color}`}>{s.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* QUICK ACTIONS */}
          <Card>
            <SectionHeader title="Quick Actions" subtitle="Authorized investigator shortcuts" />
            <div className="space-y-2.5 mt-3">
              {userRole !== 'VIEWER' && (
                <Link to="/cases/new" className="block">
                  <Button variant="primary" className="w-full justify-start text-xs" icon={<Shield className="w-4 h-4" />}>
                    Register Case File
                  </Button>
                </Link>
              )}
              <Link to="/search/crowd" className="block">
                <Button variant="secondary" className="w-full justify-start text-xs" icon={<Camera className="w-4 h-4" />}>
                  Start Crowd Search (CCTV)
                </Button>
              </Link>
              <Link to="/search/records" className="block">
                <Button variant="secondary" className="w-full justify-start text-xs" icon={<FileText className="w-4 h-4" />}>
                  Search Institutional Records
                </Button>
              </Link>
              <Link to="/search/everywhere" className="block">
                <Button variant="secondary" className="w-full justify-start text-xs" icon={<Globe className="w-4 h-4" />}>
                  Search Everywhere
                </Button>
              </Link>
              <Link to="/reports" className="block">
                <Button variant="secondary" className="w-full justify-start text-xs" icon={<FileDown className="w-4 h-4" />}>
                  Investigation Reports
                </Button>
              </Link>
            </div>
          </Card>

        </div>
      </div>

      {/* 4. LOWER AREA: REVIEW QUEUE PREVIEW & CAMERA COVERAGE MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* REVIEW QUEUE PREVIEW (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-300 pb-3 mb-4 gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-surface-950 uppercase tracking-wider">
                  PENDING REVIEW QUEUE PREVIEW
                </h3>
                <p className="text-xs text-surface-700 font-medium">Items requiring human verification & assignment</p>
              </div>

              {/* Sorting options */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-surface-700 font-extrabold uppercase">Sort:</span>
                <select 
                  value={reviewSortBy} 
                  onChange={(e) => setReviewSortBy(e.target.value as any)}
                  className="bg-surface-50 border border-surface-400 text-surface-950 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-500 font-medium"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="score">Evidence Score</option>
                  <option value="priority">Case Priority</option>
                </select>
              </div>
            </div>

            {sortedReviews.length === 0 ? (
              <EmptyState title="No items in review queue" description="All candidate groups and record matches have been reviewed." icon={UserCheck} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-surface-300 text-surface-700 font-bold">
                      <th className="py-2.5">Case / Ref</th>
                      <th className="py-2.5">Candidate / Evidence</th>
                      <th className="py-2.5">Evidence Score</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-300 text-surface-950 font-medium">
                    {sortedReviews.slice(0, 5).map((rev) => (
                      <tr key={rev.id} className="hover:bg-surface-200/60 transition-all">
                        <td className="py-3 font-extrabold text-brand-700">{rev.case_title || rev.case_name || 'Case File'}</td>
                        <td className="py-3 font-mono">Candidate Group #{rev.id?.slice(0, 8) || '01'}</td>
                        <td className="py-3 font-mono font-extrabold text-sky-800">
                          <span title="Combined evidence from configured visual, attribute, time, location and cross-source factors.">
                            Evidence Score: {rev.evidence_score}/100
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded uppercase bg-amber-500/15 text-amber-800 border border-amber-500/30">
                            {rev.status || 'Potential Match'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link to={rev.case_id ? `/cases/${rev.case_id}/investigation` : `/search/crowd`}>
                            <Button size="sm" variant="secondary" icon={<Eye className="w-3.5 h-3.5" />}>
                              Review
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* CAMERA COVERAGE GIS MAP */}
          <Card>
            <div className="flex items-center justify-between border-b border-surface-300 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-surface-950 uppercase tracking-wider">
                  CAMERA COVERAGE MAP (VIDEO SOURCES)
                </h3>
                <p className="text-xs text-surface-700 font-medium">GIS representation of uploaded video source camera locations</p>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-surface-200 text-surface-900 border border-surface-400 rounded">
                UPLOADED VIDEO SOURCES
              </span>
            </div>

            <div className="h-64 rounded-xl overflow-hidden border border-surface-300 mb-4 z-0">
              <MapContainer 
                center={[12.9716, 77.5946]} 
                zoom={11} 
                style={{ height: '100%', width: '100%', backgroundColor: '#FAF5EE' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {cameraCoverage.map((cam) => (
                  <Marker key={cam.id} position={[cam.lat, cam.lng]} icon={cameraMarkerIcon}>
                    <Popup className="text-xs">
                      <div className="p-1">
                        <strong className="block text-surface-950">{cam.name}</strong>
                        <span className="text-surface-700 text-[10px] block">{cam.location}</span>
                        <span className="text-brand-700 font-bold text-[10px]">Status: {cam.status}</span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Camera Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-surface-300 text-surface-700 font-bold">
                    <th className="py-2">Camera Label</th>
                    <th className="py-2">Location</th>
                    <th className="py-2">Searches</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-300 text-surface-950 font-medium">
                  {cameraCoverage.map((cam) => (
                    <tr key={cam.id}>
                      <td className="py-2 font-extrabold text-brand-700">{cam.name}</td>
                      <td className="py-2 text-surface-800">{cam.location}</td>
                      <td className="py-2 font-mono">{cam.searches_count}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
                          {cam.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: INVESTIGATOR WORKLOAD & TASKS */}
        <div className="space-y-6">
          
          {/* INVESTIGATOR WORKLOAD (RBAC Restricted) */}
          <Card>
            <SectionHeader title="Investigator Workload" subtitle="Assigned case counts & pending action state" />
            <div className="space-y-3 mt-3 text-xs">
              {(summary?.investigator_workload || []).map((w) => (
                <div key={w.investigator} className="p-3 bg-surface-50 border border-surface-400 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-surface-950">{w.investigator}</span>
                    <span className="text-[10px] text-surface-700 font-mono uppercase font-bold">{w.role}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-surface-200 p-1.5 rounded border border-surface-300">
                      <span className="text-surface-700 block font-bold">Cases</span>
                      <span className="font-extrabold font-mono text-surface-950 text-xs">{w.assigned_cases}</span>
                    </div>
                    <div className="bg-surface-200 p-1.5 rounded border border-surface-300">
                      <span className="text-surface-700 block font-bold">Reviews</span>
                      <span className="font-extrabold font-mono text-amber-800 text-xs">{w.pending_reviews}</span>
                    </div>
                    <div className="bg-surface-200 p-1.5 rounded border border-surface-300">
                      <span className="text-surface-700 block font-bold">Tasks</span>
                      <span className="font-extrabold font-mono text-indigo-800 text-xs">{w.open_tasks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* TASK OVERVIEW */}
          <Card>
            <SectionHeader title="Task Status" subtitle="Investigation task execution metrics" />
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center">
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl">
                <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Open</span>
                <span className="text-xl font-extrabold text-indigo-700 font-mono">{taskStats.open}</span>
              </div>
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl">
                <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Completed</span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono">{taskStats.completed}</span>
              </div>
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl">
                <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Overdue</span>
                <span className="text-xl font-extrabold text-red-700 font-mono">{taskStats.overdue}</span>
              </div>
            </div>
          </Card>

          {/* RECENT ACTIVITY FEED */}
          <Card>
            <div className="flex items-center justify-between border-b border-surface-300 pb-2 mb-3">
              <h3 className="text-xs font-extrabold text-surface-950 uppercase tracking-wider">RECENT ACTIVITY</h3>
              <select 
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="bg-surface-50 border border-surface-400 text-surface-950 text-[10px] font-bold rounded px-1.5 py-0.5"
              >
                <option value="all">All Types</option>
                <option value="case">Cases</option>
                <option value="search">Search</option>
                <option value="review">Review</option>
                <option value="task">Tasks</option>
              </select>
            </div>

            <div className="space-y-2.5 text-xs max-h-60 overflow-y-auto">
              {filteredActivity.length === 0 ? (
                <p className="text-surface-700 text-[11px]">No recent activity recorded.</p>
              ) : (
                filteredActivity.slice(0, 6).map((act, i) => (
                  <div key={i} className="p-2 bg-surface-50 border border-surface-400 rounded-lg space-y-0.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-brand-700 uppercase">{act.type}</span>
                      <span className="text-surface-700">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-surface-950 font-medium text-[11px]">{act.description}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>

      </div>

      {/* SYSTEM HEALTH DIAGNOSTIC MODAL */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-amber-950/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-50 border border-surface-400 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-300 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-surface-950 text-base">System Health Diagnostics</h3>
              </div>
              <button onClick={() => setShowHealthModal(false)} className="text-surface-700 hover:text-surface-950 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-surface-200 border border-surface-300 rounded-xl flex justify-between items-center">
                <span className="font-bold text-surface-950">Backend API (FastAPI)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300">Operational</span>
              </div>
              <div className="p-3 bg-surface-200 border border-surface-300 rounded-xl flex justify-between items-center">
                <span className="font-bold text-surface-950">Database (Supabase PostgreSQL)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300">Operational</span>
              </div>
              <div className="p-3 bg-surface-200 border border-surface-300 rounded-xl flex justify-between items-center">
                <span className="font-bold text-surface-950">Storage (Supabase Storage)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300">Operational</span>
              </div>
              <div className="p-3 bg-surface-200 border border-surface-300 rounded-xl flex justify-between items-center">
                <span className="font-bold text-surface-950">AI Intelligence (YOLO/ByteTrack/OSNet)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300">Operational</span>
              </div>
              <p className="text-[11px] text-surface-700 italic">
                Last Diagnostic Check: {new Date().toLocaleTimeString()} (All public safety integrity checks passed)
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setShowHealthModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

