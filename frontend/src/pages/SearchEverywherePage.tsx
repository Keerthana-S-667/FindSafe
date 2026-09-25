import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Globe, Search, Camera, FileText, MapPin, Clock, ShieldAlert, AlertCircle, 
  ChevronRight, Layers, RefreshCw, Eye, Check, X, FileCheck, ArrowRight, UserCheck
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';
import { caseService } from '../services/caseService';
import { recordService } from '../services/recordService';
import type { 
  MissingPersonCase, RecordMatch, CrossSourceAssociation, TimelineEvent 
} from '../types';

// Custom Leaflet marker icons with color coding
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

export const SearchEverywherePage: React.FC = () => {
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<MissingPersonCase | null>(null);

  // Configuration
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [timeWindow, setTimeWindow] = useState<number>(72);

  // Search Results State
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recordMatches, setRecordMatches] = useState<RecordMatch[]>([]);
  const [crossAssociations, setCrossAssociations] = useState<CrossSourceAssociation[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default Map center (Delhi Central Hub)
  const defaultCenter: [number, number] = [28.6139, 77.2090];

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const res = await caseService.getCases();
      const list = res?.items || [];
      setCases(list);
      if (list.length > 0) {
        setSelectedCaseId(list[0].id);
        setSelectedCase(list[0]);
      }
    } catch (err) {
      setErrorMsg('Failed to load missing person cases.');
    }
  };

  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(caseId);
    const found = cases.find((c) => c.id === caseId || c.case_id === caseId);
    setSelectedCase(found || null);
  };

  const handleStartSearchEverywhere = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      setErrorMsg('Please select a missing person case file.');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const sourceList = sourceTypeFilter === 'all' ? ['all'] : [sourceTypeFilter];
      const res = await recordService.executeSearchEverywhere({
        case_id: selectedCaseId,
        source_types: sourceList,
        search_radius_km: searchRadius,
        time_window_hours: timeWindow,
      });

      const sId = res.search_session_id;
      setSessionId(sId);
      setRecordMatches(res.record_matches || []);
      setCrossAssociations(res.cross_source_associations || []);

      // Fetch unified timeline and map markers
      if (sId) {
        const [tlRes, mapRes] = await Promise.all([
          recordService.getInvestigationTimeline(sId),
          recordService.getInvestigationMap(sId),
        ]);
        setTimelineEvents(tlRes.timeline || []);
        setMapMarkers(mapRes.markers || []);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Search Everywhere execution failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const getSourceIconMarker = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'missing_person_case': return markerIcons.case;
      case 'camera': return markerIcons.camera;
      case 'police': return markerIcons.police;
      case 'hospital': return markerIcons.hospital;
      case 'shelter': return markerIcons.shelter;
      case 'public_report': return markerIcons.public_report;
      default: return markerIcons.public_report;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Search Everywhere"
        subtitle="Unified Intelligence Platform: Simultaneously orchestrate multi-camera CCTV crowd search and institutional record matching."
      />

      {/* Mandatory Human Verification Banner */}
      <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-900 mb-6 font-medium">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong className="font-extrabold text-amber-950">Mandatory Human Verification Notice:</strong> Search Everywhere presents <em>Potentially Related Evidence</em> fused from camera sightings and records. Human review remains mandatory.
        </span>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-3 text-xs text-red-900 mb-6 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Everywhere Configuration Controls */}
      <Card className="mb-6">
        <form onSubmit={handleStartSearchEverywhere} className="space-y-6">
          <SectionHeader
            title="Search Everywhere Configuration"
            subtitle="Select case file and configure simultaneous multi-camera and multi-record matching parameters"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Select Missing Person Case File"
              required
              value={selectedCaseId}
              onChange={(e) => handleCaseChange(e.target.value)}
              options={
                cases.length > 0
                  ? cases.map((c) => ({
                      value: c.id,
                      label: `${c.case_id || 'MP'} - ${c.reference_name || c.full_name} (${c.last_seen_location || 'Unknown'})`,
                    }))
                  : [{ value: '', label: 'Loading cases...' }]
              }
            />

            <div>
              <label className="block text-xs font-bold text-surface-950 mb-2">Institutional Record Sources</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Sources' },
                  { id: 'police', label: 'Police' },
                  { id: 'hospital', label: 'Hospital' },
                  { id: 'shelter', label: 'Shelter' },
                  { id: 'public_report', label: 'Public Report' },
                ].map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setSourceTypeFilter(src.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      sourceTypeFilter === src.id
                        ? 'bg-brand-500/20 text-brand-800 border-brand-500/50 shadow-xs'
                        : 'bg-surface-200 text-surface-800 border-surface-300 hover:border-surface-400'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-50 border border-surface-400 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-surface-800 mb-1">Spatial Search Radius</label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full bg-surface-50 border border-surface-400 text-surface-950 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-medium"
              >
                <option value={5}>5 km radius</option>
                <option value={10}>10 km radius</option>
                <option value={25}>25 km radius</option>
                <option value={50}>50 km radius</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-800 mb-1">Temporal Scope</label>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(Number(e.target.value))}
                className="w-full bg-surface-50 border border-surface-400 text-surface-950 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-medium"
              >
                <option value={6}>Within 6 hours</option>
                <option value={24}>Within 24 hours</option>
                <option value={72}>Within 72 hours</option>
                <option value={168}>Within 7 days</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-surface-700 font-medium">
              Orchestrates Camera Crowd Search + Police / Hospital / Shelter Record Matching.
            </span>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSearching}
              icon={<Globe className="w-4 h-4" />}
            >
              Start Search Everywhere
            </Button>
          </div>
        </form>
      </Card>

      {/* Visual Pipeline Summary (Section 66 Structure) */}
      <div className="space-y-6">
        {/* CAMERA EVIDENCE PIPELINE */}
        <Card>
          <SectionHeader
            title="Camera Evidence Stream"
            subtitle="Multi-camera CCTV crowd sightings evaluated via YOLO, ByteTrack, and OSNet Re-ID"
          />
          <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-800">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-surface-950 block">Surveillance Feeds</span>
                <span className="text-[11px] text-surface-700 font-medium">Camera 01 → Camera 02 → Camera 04</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-extrabold text-sky-900 bg-sky-500/15 px-3 py-1.5 rounded-lg border border-sky-500/30">
              <span>Status: Multi-Camera Processing Complete</span>
            </div>
          </div>
        </Card>

        {/* RECORD EVIDENCE PIPELINE */}
        <Card>
          <SectionHeader
            title="Institutional Record Stream"
            subtitle="Records evaluated across Police, Hospital, Shelter, and Public Report databases"
          />
          <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-800">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-surface-950 block">Record Databases</span>
                <span className="text-[11px] text-surface-700 font-medium">Shelter → Hospital → Police → Public Tips</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900 bg-indigo-500/15 px-3 py-1.5 rounded-lg border border-indigo-500/30">
              <span>Matches Identified: {recordMatches.length}</span>
            </div>
          </div>
        </Card>

        {/* UNIFIED INVESTIGATION TIMELINE */}
        <Card>
          <SectionHeader
            title="Unified Investigation Timeline"
            subtitle="Chronological sequence fusing CCTV camera sightings and institutional record filings"
          />

          {timelineEvents.length === 0 ? (
            <EmptyState
              title="Timeline empty"
              description="Execute 'Start Search Everywhere' to generate a unified chronological timeline."
              icon={Clock}
            />
          ) : (
            <div className="relative pl-6 border-l-2 border-surface-300 space-y-6 my-4">
              {timelineEvents.map((ev, idx) => (
                <div key={ev.id || idx} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-surface-50 border-2 border-brand-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                  </div>

                  <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-2 hover:border-surface-500 transition-all shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-surface-950">{ev.source_label}</span>
                        <span className="text-[10px] text-surface-700 px-2 py-0.5 bg-surface-200 rounded border border-surface-300 uppercase font-extrabold">
                          {ev.source.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-surface-700 font-bold">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Recent Sighting'}
                      </span>
                    </div>

                    <p className="text-xs text-surface-900 font-medium leading-relaxed">{ev.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-surface-700 pt-1 border-t border-surface-300 font-medium">
                      <span>Location: <strong className="text-surface-950">{ev.location_name}</strong></span>
                      <span>Evidence Score: <strong className="text-brand-700 font-mono">{ev.evidence_score.toFixed(1)}/100</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* INVESTIGATION MAP */}
        <Card>
          <SectionHeader
            title="Investigation GIS & Evidence Map"
            subtitle="Spatial markers for camera sightings and institutional record locations"
          />

          <div className="h-[450px] w-full rounded-xl overflow-hidden border border-surface-300 relative mt-4 shadow-xs">
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', backgroundColor: '#FAF5EE' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {mapMarkers.map((m, idx) => (
                <Marker
                  key={m.id || idx}
                  position={[m.latitude, m.longitude]}
                  icon={getSourceIconMarker(m.source)}
                >
                  <Popup>
                    <div className="p-2 text-xs space-y-1.5 max-w-xs">
                      <div className="font-bold text-surface-950 border-b pb-1 flex justify-between items-center">
                        <span>{m.source_label}</span>
                        <span className="text-[10px] text-brand-700 font-mono">{m.evidence_score?.toFixed(1)}/100</span>
                      </div>
                      <p className="text-[11px] text-surface-800">{m.title}</p>
                      <p className="text-[10px] text-surface-700 font-mono">Location: {m.location_name}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>

        {/* RELATED EVIDENCE & CROSS-SOURCE ASSOCIATIONS */}
        <Card>
          <SectionHeader
            title="Related Evidence & Cross-Source Candidate Associations"
            subtitle="Fused evidence pairings between CCTV camera sightings and institutional found-person records"
          />

          {crossAssociations.length === 0 ? (
            <EmptyState
              title="No cross-source associations identified yet"
              description="Execute Search Everywhere to generate fused cross-source evidence."
              icon={Globe}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {crossAssociations.map((assoc) => (
                <div key={assoc.id} className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-extrabold text-surface-950 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-brand-600" />
                      Potentially Related Evidence Pair
                    </span>
                    <span className="text-xs font-extrabold text-brand-700 font-mono">
                      Unified Evidence Score: {assoc.overall_score.toFixed(1)} / 100
                    </span>
                  </div>

                  <p className="text-xs text-surface-900 font-medium">
                    {assoc.evidence_summary?.description || 'Compatible visual appearance and spatial-temporal evidence.'}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 bg-surface-200 rounded-lg border border-surface-300 font-mono">
                    <div>Visual Consistency: <span className="text-surface-950 font-bold">{(assoc.visual_consistency * 100).toFixed(0)}%</span></div>
                    <div>Attribute Match: <span className="text-surface-950 font-bold">{(assoc.attribute_consistency * 100).toFixed(0)}%</span></div>
                    <div>Time Consistency: <span className="text-surface-950 font-bold">{(assoc.time_consistency * 100).toFixed(0)}%</span></div>
                    <div>Spatial Proximity: <span className="text-surface-950 font-bold">{(assoc.location_consistency * 100).toFixed(0)}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
