import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Globe, Search, Camera, FileText, MapPin, Clock, ShieldAlert, AlertCircle, 
  ChevronRight, Layers, RefreshCw, Eye, Check, X, FileCheck, ArrowRight, UserCheck, 
  Download, FileSpreadsheet, CheckCircle2, Ban, ShieldCheck, Filter, Play, ExternalLink,
  Columns, Network
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';
import { reportService, type WorkspacePayload, type InvestigationReportItem } from '../services/reportService';
import { recordService } from '../services/recordService';
import { intelligenceService } from '../services/intelligenceService';
import { EvidenceGraph } from '../components/investigation/EvidenceGraph';
import { CandidateComparisonModal } from '../components/investigation/CandidateComparisonModal';
import { InvestigationTasks } from '../components/investigation/InvestigationTasks';
import type { MissingPersonCase, CandidateGroup, RecordMatch, CrossSourceAssociation, TimelineEvent } from '../types';

// Custom colored Leaflet marker icons
const createCustomMarkerIcon = (color: string, emoji: string) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: ${color}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4); font-weight: bold; font-size: 13px;">${emoji}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const markerIcons = {
  case: createCustomMarkerIcon('#ef4444', '📍'),
  camera: createCustomMarkerIcon('#0284c7', '🎥'),
  police: createCustomMarkerIcon('#4338ca', '👮'),
  hospital: createCustomMarkerIcon('#e11d48', '🏥'),
  shelter: createCustomMarkerIcon('#059669', '🏠'),
  public_report: createCustomMarkerIcon('#7c3aed', '📣')
};

export const InvestigationWorkspacePage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation tab state
  const activeTab = searchParams.get('tab') || 'overview';
  const highlightedCandidateId = searchParams.get('candidate');
  const highlightedRecordId = searchParams.get('record');

  // Workspace Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [payload, setPayload] = useState<WorkspacePayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Phase 11 Comparison Modal & Graph State
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Outcome & Verification State
  const [showOutcomeModal, setShowOutcomeModal] = useState<boolean>(false);
  const [selectedOutcome, setSelectedOutcome] = useState<any>('under_review');
  const [outcomeNote, setOutcomeNote] = useState<string>('');
  const [isUpdatingOutcome, setIsUpdatingOutcome] = useState<boolean>(false);

  // Report Generation State
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  // Video Player Modal State
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  // Timeline Filter State
  const [timelineSourceFilter, setTimelineSourceFilter] = useState<string>('all');

  const defaultCenter: [number, number] = [28.6139, 77.2090];

  useEffect(() => {
    if (caseId) {
      loadWorkspaceData(caseId);
    }
  }, [caseId]);

  const loadWorkspaceData = async (cId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await reportService.getInvestigationWorkspace(cId);
      setPayload(data);
      if (data.case?.investigation_outcome) {
        setSelectedOutcome(data.case.investigation_outcome);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to load investigation workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  const handleGeneratePDFReport = async () => {
    if (!caseId) return;
    setIsGeneratingReport(true);
    setReportSuccessMsg(null);
    setErrorMsg(null);
    try {
      const rep = await reportService.generateReport(caseId);
      setReportSuccessMsg(`Successfully generated PDF report version ${rep.report_version} (${rep.report_id})`);
      // Reload workspace data to update reports list
      await loadWorkspaceData(caseId);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to generate PDF report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadPDF = async (reportId: string) => {
    try {
      const blob = await reportService.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErrorMsg('Failed to download report PDF file.');
    }
  };

  const handleSaveOutcome = async () => {
    if (!caseId) return;
    setIsUpdatingOutcome(true);
    try {
      await reportService.updateInvestigationOutcome(caseId, selectedOutcome, outcomeNote);
      setShowOutcomeModal(false);
      await loadWorkspaceData(caseId);
    } catch (err) {
      setErrorMsg('Failed to update investigation outcome.');
    } finally {
      setIsUpdatingOutcome(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-400 mx-auto" />
            <p className="text-xs text-surface-400">Loading Final Investigation Workspace...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const caseObj = payload?.case;
  const summary = payload?.summary;
  const reports = payload?.reports || [];
  const matches = payload?.record_matches || [];
  const groups = payload?.candidate_groups || [];
  const assocs = payload?.cross_source_associations || [];
  const timeline = payload?.timeline || [];
  const markers = payload?.map_markers || [];

  const filteredTimeline = timeline.filter((ev) => {
    if (timelineSourceFilter === 'all') return true;
    return ev.source?.toLowerCase() === timelineSourceFilter.toLowerCase();
  });

  return (
    <PageContainer>
      {/* CASE HEADER SECTION (Section 2 of Prompt) */}
      <div className="bg-surface-50 border border-surface-400 rounded-2xl p-6 mb-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-300 pb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono font-bold text-brand-700 bg-brand-500/15 px-2.5 py-1 rounded-md border border-brand-500/30">
                {caseObj?.case_id || 'MP-CASE'}
              </span>
              <h1 className="text-xl font-extrabold text-surface-950">
                {caseObj?.reference_name || caseObj?.full_name}
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full border ${
                caseObj?.investigation_outcome === 'verified_by_reviewer' ? 'bg-emerald-500/15 text-emerald-900 border-emerald-500/30' :
                caseObj?.investigation_outcome === 'potential_match_identified' ? 'bg-amber-500/15 text-amber-900 border-amber-500/30' :
                caseObj?.investigation_outcome === 'closed' ? 'bg-surface-200 text-surface-800 border-surface-400' :
                'bg-sky-500/15 text-sky-900 border-sky-500/30'
              }`}>
                {caseObj?.investigation_outcome?.replace(/_/g, ' ').toUpperCase() || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-surface-700 flex items-center gap-4 flex-wrap font-medium">
              <span>Last Seen: <strong className="text-surface-950">{caseObj?.last_seen_location}</strong></span>
              <span>Time: <strong className="text-surface-950">{caseObj?.last_seen_timestamp ? new Date(caseObj.last_seen_timestamp).toLocaleString() : 'N/A'}</strong></span>
              <span>Radius: <strong className="text-surface-950">{caseObj?.search_radius_km || 25} km</strong></span>
            </p>
          </div>

          {/* Compact Action Menu */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/search-crowd`}>
              <Button size="sm" variant="secondary" icon={<Camera className="w-3.5 h-3.5" />}>
                Search Crowd
              </Button>
            </Link>
            <Link to={`/search-records`}>
              <Button size="sm" variant="secondary" icon={<FileText className="w-3.5 h-3.5" />}>
                Search Records
              </Button>
            </Link>
            <Link to={`/search-everywhere`}>
              <Button size="sm" variant="secondary" icon={<Globe className="w-3.5 h-3.5" />}>
                Search Everywhere
              </Button>
            </Link>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const url = intelligenceService.getExportCsvUrl(caseId || '');
                window.open(url, '_blank');
              }}
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (groups.length >= 2) {
                  setCompareIds(groups.slice(0, 4).map(g => g.id));
                  setCompareModalOpen(true);
                } else if (groups.length === 1) {
                  setCompareIds([groups[0].id]);
                  setCompareModalOpen(true);
                }
              }}
              icon={<Columns className="w-3.5 h-3.5 text-sky-700" />}
            >
              Compare Candidates
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowOutcomeModal(true)}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Update Outcome
            </Button>
            <Button
              size="sm"
              variant="primary"
              isLoading={isGeneratingReport}
              onClick={handleGeneratePDFReport}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Generate Report
            </Button>
          </div>
        </div>

        {/* Mandatory Verification & Compliance Banner */}
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong className="font-extrabold text-amber-950">Mandatory Human Verification Guarantee:</strong> AI-generated evidence supports investigation and does not establish identity. Final verification is performed by authorized personnel.
          </span>
        </div>
      </div>

      {reportSuccessMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-900 mb-6 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
          <span>{reportSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-3 text-xs text-red-900 mb-6 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUMMARY COUNTER CARDS (Section 4 of Prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-3.5 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Search Sessions</span>
          <span className="text-xl font-extrabold text-surface-950 font-mono">{summary?.search_sessions_count || 0}</span>
        </div>
        <div className="p-3.5 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Candidate Groups</span>
          <span className="text-xl font-extrabold text-sky-700 font-mono">{summary?.candidate_groups_count || 0}</span>
        </div>
        <div className="p-3.5 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Record Matches</span>
          <span className="text-xl font-extrabold text-indigo-700 font-mono">{summary?.record_matches_count || 0}</span>
        </div>
        <div className="p-3.5 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Cross-Source Pairs</span>
          <span className="text-xl font-extrabold text-brand-700 font-mono">{summary?.cross_source_count || 0}</span>
        </div>
        <div className="p-3.5 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Pending Reviews</span>
          <span className="text-xl font-extrabold text-amber-700 font-mono">{summary?.pending_reviews_count || 0}</span>
        </div>
        <div className="p-3.5 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">PDF Reports</span>
          <span className="text-xl font-extrabold text-emerald-700 font-mono">{summary?.reports_count || 0}</span>
        </div>
      </div>

      {/* NAVIGATION TABS (Section 42 of Prompt) */}
      <div className="flex items-center gap-2 border-b border-surface-300 pb-3 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'camera', label: `Camera Evidence (${groups.length})` },
          { id: 'records', label: `Record Evidence (${matches.length})` },
          { id: 'candidates', label: `Candidate Groups (${groups.length})` },
          { id: 'timeline', label: `Timeline (${timeline.length})` },
          { id: 'map', label: 'Investigation Map' },
          { id: 'reports', label: `Reports (${reports.length})` },
          { id: 'review', label: 'Outcome Review' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? 'bg-brand-500/20 text-brand-800 border-brand-500/50 shadow-xs'
                : 'bg-surface-200 text-surface-800 border-surface-300 hover:border-surface-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <SectionHeader
              title="Unified Multi-Modal Evidence Overview"
              subtitle="Categorized evidence scores across computer-vision and institutional record matching engines"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-2 shadow-xs">
                <span className="text-xs font-extrabold text-surface-950 block">Appearance & Re-ID</span>
                <div className="h-2 bg-surface-300 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600" style={{ width: '85%' }} />
                </div>
                <span className="text-[11px] text-surface-700 font-mono font-medium">512-dim OSNet Embedding Cosine Matching</span>
              </div>

              <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-2 shadow-xs">
                <span className="text-xs font-extrabold text-surface-950 block">Visual Attributes</span>
                <div className="h-2 bg-surface-300 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-600" style={{ width: '80%' }} />
                </div>
                <span className="text-[11px] text-surface-700 font-mono font-medium">Upper/Lower Clothing & Accessories</span>
              </div>

              <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-2 shadow-xs">
                <span className="text-xs font-extrabold text-surface-950 block">Spatial Proximity</span>
                <div className="h-2 bg-surface-300 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600" style={{ width: '90%' }} />
                </div>
                <span className="text-[11px] text-surface-700 font-mono font-medium">Haversine Distance vs Search Radius</span>
              </div>

              <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-2 shadow-xs">
                <span className="text-xs font-extrabold text-surface-950 block">Temporal Consistency</span>
                <div className="h-2 bg-surface-300 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600" style={{ width: '88%' }} />
                </div>
                <span className="text-[11px] text-surface-700 font-mono font-medium">Timestamp Delta & Transition Speed</span>
              </div>
            </div>
          </Card>

          {/* Quick Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <SectionHeader title="Top Candidate Groups" subtitle="Multi-camera candidate sightings" />
              {groups.length === 0 ? (
                <EmptyState title="No candidate groups" description="Run Search Crowd to generate candidate groups." icon={Camera} />
              ) : (
                <div className="space-y-3 mt-3">
                  {groups.slice(0, 3).map((g) => (
                    <div key={g.id} className="p-3 bg-surface-50 border border-surface-400 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-xs font-extrabold text-surface-950 block">Group #{g.id.slice(0, 8)}</span>
                        <span className="text-[11px] text-surface-700 font-medium">{g.camera_count} Camera Sightings</span>
                      </div>
                      <span className="text-sm font-extrabold text-brand-700 font-mono">{g.overall_score}/100</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <SectionHeader title="Top Record Matches" subtitle="Institutional police/hospital matches" />
              {matches.length === 0 ? (
                <EmptyState title="No record matches" description="Run Search Records to analyze database records." icon={FileText} />
              ) : (
                <div className="space-y-3 mt-3">
                  {matches.slice(0, 3).map((m) => (
                    <div key={m.id} className="p-3 bg-surface-50 border border-surface-400 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-xs font-extrabold text-surface-950 block">{m.found_person_records?.record_id}</span>
                        <span className="text-[11px] text-surface-700 uppercase font-bold">{m.found_person_records?.source_type}</span>
                      </div>
                      <span className="text-sm font-extrabold text-brand-700 font-mono">{m.overall_score.toFixed(1)}/100</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* PHASE 11: 2D EVIDENCE RELATIONSHIP GRAPH */}
          {caseId && <EvidenceGraph caseId={caseId} />}

          {/* PHASE 11: FOLLOW-UP INVESTIGATION TASKS */}
          {caseId && <InvestigationTasks caseId={caseId} />}
        </div>
      )}

      {/* 2. CAMERA EVIDENCE TAB */}
      {activeTab === 'camera' && (
        <Card>
          <SectionHeader
            title="CCTV Camera Surveillance Evidence"
            subtitle="Extracted candidate person tracks and sightings across CCTV nodes"
          />
          {groups.length === 0 ? (
            <EmptyState title="No camera evidence" description="No multi-camera candidate sightings available for this case." icon={Camera} />
          ) : (
            <div className="space-y-4 mt-4">
              {groups.map((group) => (
                <div key={group.id} className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-surface-950">Candidate Group #{group.id}</span>
                    <span className="text-xs font-mono font-extrabold text-brand-700">Score: {group.overall_score}/100</span>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto">
                    {group.sightings.map((s, idx) => (
                      <div key={idx} className="w-24 h-24 bg-surface-200 border border-surface-300 rounded-lg overflow-hidden relative shrink-0 flex items-center justify-center">
                        {s.signed_crop_url ? (
                          <img
                            src={s.signed_crop_url}
                            alt={s.camera_name}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <div
                          className={`w-full h-full flex flex-col items-center justify-center text-[10px] text-surface-700 font-medium ${
                            s.signed_crop_url ? 'hidden' : 'flex'
                          }`}
                        >
                          <Camera className="w-5 h-5 text-brand-600 mb-0.5" />
                          <span className="text-[9px] font-bold">CCTV</span>
                        </div>
                        <span className="absolute bottom-0 inset-x-0 bg-brand-900/80 text-[9px] text-amber-50 text-center truncate py-0.5 font-bold">
                          {s.camera_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 3. RECORD EVIDENCE TAB */}
      {activeTab === 'records' && (
        <Card>
          <SectionHeader
            title="Institutional Found-Person Record Evidence"
            subtitle="Matched records from Police, Hospital, Shelter, and Public Reports"
          />
          {matches.length === 0 ? (
            <EmptyState title="No record matches" description="No record matches available for this case." icon={FileText} />
          ) : (
            <div className="space-y-4 mt-4">
              {matches.map((match) => (
                <div key={match.id} className="p-4 bg-surface-50 border border-surface-400 rounded-xl flex items-center justify-between gap-4 shadow-xs">
                  <div>
                    <span className="text-xs font-extrabold text-surface-950 block">{match.found_person_records?.record_id}</span>
                    <span className="text-[11px] text-surface-700 uppercase font-bold">{match.found_person_records?.source_type} • {match.found_person_records?.location}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold font-mono text-brand-700 block">{match.overall_score.toFixed(1)}/100</span>
                    <span className="text-[10px] text-surface-700 uppercase font-extrabold">{match.match_status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 4. CANDIDATES TAB */}
      {activeTab === 'candidates' && (
        <Card>
          <SectionHeader title="Multi-Camera Candidate Groups" subtitle="Candidate groups generated by Phase 5/6 computer vision pipeline" />
          {groups.length === 0 ? (
            <EmptyState title="No candidate groups" description="Execute Search Crowd to detect camera candidate groups." icon={UserCheck} />
          ) : (
            <div className="space-y-4 mt-4">
              {groups.map((g) => (
                <div key={g.id} className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-2 shadow-xs">
                  <div className="flex justify-between items-center text-xs font-extrabold text-surface-950">
                    <span>Group #{g.id}</span>
                    <span className="text-brand-700 font-mono">{g.overall_score}/100</span>
                  </div>
                  <p className="text-xs text-surface-800 font-medium">Contains {g.camera_count} camera sightings across surveillance feeds.</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 5. TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <Card>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <SectionHeader title="Chronological Investigation Timeline" subtitle="Unified chronological sequence of sightings and records" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-surface-700" />
              <select
                value={timelineSourceFilter}
                onChange={(e) => setTimelineSourceFilter(e.target.value)}
                className="bg-surface-50 border border-surface-400 text-surface-950 rounded-lg px-3 py-1 text-xs font-medium"
              >
                <option value="all">All Evidence Sources</option>
                <option value="camera">Camera Sightings Only</option>
                <option value="police">Police Records</option>
                <option value="hospital">Hospital Intake</option>
                <option value="shelter">Shelter Logs</option>
                <option value="public_report">Public Tips</option>
              </select>
            </div>
          </div>

          <div className="relative pl-6 border-l-2 border-surface-300 space-y-6 my-4">
            {filteredTimeline.map((ev, idx) => (
              <div key={ev.id || idx} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-surface-50 border-2 border-brand-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                </div>
                <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-surface-950">{ev.source_label}</span>
                    <span className="font-mono text-surface-700 font-bold">{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-xs text-surface-900 font-medium">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. MAP TAB */}
      {activeTab === 'map' && (
        <Card>
          <SectionHeader title="Investigation GIS Map" subtitle="Geographic evidence markers and spatial sequence layer" />
          <div className="h-[500px] w-full rounded-xl overflow-hidden border border-surface-300 relative mt-4 shadow-xs">
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', backgroundColor: '#FAF5EE' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markers.map((m, idx) => (
                <Marker key={m.id || idx} position={[m.latitude, m.longitude]} icon={markerIcons.camera}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <p className="font-bold text-surface-950">{m.source_label}</p>
                      <p className="text-surface-800">{m.title}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>
      )}

      {/* 7. REPORTS TAB */}
      {activeTab === 'reports' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="PDF Report History & Downloads" subtitle="Generated official investigation PDF report versions" />
            <Button size="sm" variant="primary" isLoading={isGeneratingReport} onClick={handleGeneratePDFReport} icon={<Download className="w-3.5 h-3.5" />}>
              Generate New Version
            </Button>
          </div>

          {reports.length === 0 ? (
            <EmptyState title="No reports generated yet" description="Click 'Generate New Version' to create an official investigation PDF report." icon={Download} />
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 bg-surface-50 border border-surface-400 rounded-xl flex items-center justify-between gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-surface-950">{rep.report_id}</span>
                      <span className="text-[10px] bg-brand-500/15 text-brand-800 px-2 py-0.5 rounded border border-brand-500/30 font-bold">Version {rep.report_version}</span>
                    </div>
                    <span className="text-[11px] text-surface-700 block mt-1 font-medium">Generated: {new Date(rep.generated_at).toLocaleString()}</span>
                  </div>

                  <Button size="sm" variant="secondary" onClick={() => handleDownloadPDF(rep.report_id)} icon={<Download className="w-3.5 h-3.5" />}>
                    Download PDF
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 8. REVIEW TAB */}
      {activeTab === 'review' && (
        <Card>
          <SectionHeader title="Human Verification & Investigation Outcome" subtitle="Persist official human reviewer decisions in database audit trail" />
          <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-4 mt-4 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-surface-800">Current Case Outcome</span>
              <span className="text-xs font-mono font-extrabold text-brand-700 uppercase">{caseObj?.investigation_outcome || 'OPEN'}</span>
            </div>
            <Button size="sm" variant="primary" onClick={() => setShowOutcomeModal(true)} icon={<ShieldCheck className="w-4 h-4" />}>
              Update Investigation Outcome
            </Button>
          </div>
        </Card>
      )}

      {/* Outcome Update Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 bg-amber-950/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-50 border border-surface-400 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-surface-300">
              <h3 className="text-base font-extrabold text-surface-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                Update Investigation Outcome
              </h3>
              <button onClick={() => setShowOutcomeModal(false)} className="text-surface-700 hover:text-surface-950 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-900 leading-relaxed font-medium">
              <strong className="font-extrabold text-amber-950">Human Decision Notice:</strong> Verification is an explicit human decision and does not originate from the AI system.
            </div>

            <Select
              label="Select Case Outcome State"
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              options={[
                { value: 'open', label: 'Open (Investigation active)' },
                { value: 'under_review', label: 'Under Review (Evidence being evaluated)' },
                { value: 'potential_match_identified', label: 'Potential Match Identified' },
                { value: 'verified_by_reviewer', label: 'Verified by Authorized Reviewer' },
                { value: 'no_match_identified', label: 'No Match Identified in Analyzed Feeds' },
                { value: 'closed', label: 'Closed (Investigation finalized)' },
              ]}
            />

            <div>
              <label className="block text-xs font-bold text-surface-800 mb-1">Outcome Notes</label>
              <textarea
                value={outcomeNote}
                onChange={(e) => setOutcomeNote(e.target.value)}
                placeholder="Enter formal investigator findings..."
                className="w-full bg-surface-50 border border-surface-400 text-surface-950 rounded-lg p-3 text-xs h-24 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-300">
              <Button variant="secondary" onClick={() => setShowOutcomeModal(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isUpdatingOutcome} onClick={handleSaveOutcome}>Save Outcome</Button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Comparison Modal */}
      <CandidateComparisonModal
        candidateIds={compareIds}
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
      />
    </PageContainer>
  );
};
