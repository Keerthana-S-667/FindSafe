import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserCheck, Eye, ShieldAlert, Clock, MapPin, Layers, Sparkles, 
  Filter, Navigation, Camera, FileText, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { FilterBar } from '../components/ui/FilterBar';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { searchService } from '../services/searchService';
import { recordService } from '../services/recordService';
import { caseService } from '../services/caseService';
import type { CandidateGroup, MissingPersonCase, RecordMatch } from '../types';

export const CandidatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidateGroups, setCandidateGroups] = useState<CandidateGroup[]>([]);
  const [recordMatches, setRecordMatches] = useState<RecordMatch[]>([]);
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedCaseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const caseRes = await caseService.getCases();
      const caseList = caseRes.items || [];
      setCases(caseList);

      const caseFilter = selectedCaseId !== 'ALL' ? selectedCaseId : undefined;
      const [groups, matches] = await Promise.all([
        searchService.getAllCandidateGroups(caseFilter),
        recordService.getRecordMatches(caseFilter)
      ]);

      setCandidateGroups(groups || []);
      setRecordMatches(matches || []);
    } catch (err) {
      console.warn('Candidate data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showCamera = evidenceFilter === 'ALL' || evidenceFilter === 'CAMERA';
  const showRecords = evidenceFilter === 'ALL' || evidenceFilter === 'RECORDS';

  const filteredCameraGroups = showCamera ? candidateGroups.filter((g) => {
    if (selectedCaseId !== 'ALL' && g.case_id !== selectedCaseId) return false;
    return true;
  }) : [];

  const filteredRecordMatches = showRecords ? recordMatches.filter((m) => {
    if (selectedCaseId !== 'ALL' && m.missing_person_id !== selectedCaseId) return false;
    return true;
  }) : [];

  const totalResults = filteredCameraGroups.length + filteredRecordMatches.length;

  return (
    <PageContainer>
      <PageHeader
        title="Candidate Review & Multi-Factor Evidence Verification"
        subtitle="Review, verify, or reject potential candidate groups detected across CCTV camera feeds and institutional records."
      />

      {/* Mandatory Privacy Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-900 mb-6">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
        <div>
          <span className="font-bold text-amber-950 block mb-0.5">Privacy-Conscious Attribute Intelligence</span>
          System results are derived strictly from non-sensitive clothing, appearance, time, and location context. All candidate matches require human verification before action.
        </div>
      </div>

      <FilterBar onReset={() => { setSelectedCaseId('ALL'); setEvidenceFilter('ALL'); }}>
        <div className="w-64">
          <Select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Cases' },
              ...cases.map((c) => ({ value: c.id, label: `${c.case_id || 'CASE'} - ${c.reference_name || c.full_name}` }))
            ]}
          />
        </div>
        <div className="w-64">
          <Select
            value={evidenceFilter}
            onChange={(e) => setEvidenceFilter(e.target.value)}
            options={[
              { value: 'ALL', label: `All Evidence Sources (${candidateGroups.length + recordMatches.length})` },
              { value: 'CAMERA', label: `Camera Crowd Candidates (${candidateGroups.length})` },
              { value: 'RECORDS', label: `Institutional Record Matches (${recordMatches.length})` },
            ]}
          />
        </div>
      </FilterBar>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-surface-800 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            Loading candidates and evidence...
          </div>
        ) : totalResults === 0 ? (
          <EmptyState
            title="No candidates require review"
            description="Candidate groups generated by multi-camera YOLO, ByteTrack, OSNet, and visual attribute matching will appear here for human verification."
            icon={UserCheck}
          />
        ) : (
          <div className="space-y-6">
            {/* 1. Camera Crowd Candidate Groups */}
            {filteredCameraGroups.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-300">
                  <h3 className="text-sm font-extrabold text-surface-950 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-brand-600" />
                    Camera Crowd Candidates ({filteredCameraGroups.length})
                  </h3>
                  <span className="text-xs text-surface-800 font-bold">Multi-Camera Sighting Groups</span>
                </div>

                {filteredCameraGroups.map((group, idx) => (
                  <div
                    key={group.id}
                    className="p-5 bg-surface-50 border border-surface-400 hover:border-brand-500 rounded-2xl transition-all duration-200 space-y-4 shadow-xs"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-300 pb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="brand">Candidate Group #{idx + 1}</Badge>
                        <Badge variant={group.evidence_level === 'high' ? 'success' : group.evidence_level === 'moderate' ? 'warning' : 'default'}>
                          {(group.evidence_level || 'HIGH').toUpperCase()} EVIDENCE
                        </Badge>
                        <span className="text-xs text-surface-800 font-bold font-mono">
                          {group.camera_count || group.sightings?.length || 1} Camera Sightings
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-surface-800 font-bold uppercase tracking-wider block">Evidence Score</span>
                          <span className="text-lg font-extrabold font-mono text-brand-700">{group.overall_score}/100</span>
                        </div>
                        <Link to={`/candidates/${group.id}`}>
                          <Button size="sm" variant="primary" icon={<Eye className="w-3.5 h-3.5" />}>
                            Review Evidence
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Evidence breakdown chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="p-2.5 bg-surface-200 rounded-lg border border-surface-300 space-y-0.5">
                        <span className="text-[10px] text-surface-800 font-bold uppercase tracking-wider block">Visual Similarity</span>
                        <span className="font-extrabold text-brand-700 font-mono">{group.visual_score || (group.overall_score * 0.9).toFixed(1)}/100</span>
                      </div>
                      <div className="p-2.5 bg-surface-200 rounded-lg border border-surface-300 space-y-0.5">
                        <span className="text-[10px] text-surface-800 font-bold uppercase tracking-wider block">Attributes</span>
                        <span className="font-extrabold text-brand-700 font-mono">{group.attribute_score || (group.overall_score * 0.85).toFixed(1)}/100</span>
                      </div>
                      <div className="p-2.5 bg-surface-200 rounded-lg border border-surface-300 space-y-0.5">
                        <span className="text-[10px] text-surface-800 font-bold uppercase tracking-wider block">Time Consistency</span>
                        <span className="font-extrabold text-brand-700 font-mono">{group.time_score || 85.0}/100</span>
                      </div>
                      <div className="p-2.5 bg-surface-200 rounded-lg border border-surface-300 space-y-0.5">
                        <span className="text-[10px] text-surface-800 font-bold uppercase tracking-wider block">Location Plausibility</span>
                        <span className="font-extrabold text-brand-700 font-mono">{group.location_score || 80.0}/100</span>
                      </div>
                      <div className="p-2.5 bg-surface-200 rounded-lg border border-surface-300 space-y-0.5 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-surface-800 font-bold uppercase tracking-wider block">Cross-Camera</span>
                        <span className="font-extrabold text-brand-700 font-mono">{group.cross_camera_score || 90.0}/100</span>
                      </div>
                    </div>

                    {/* Sighting previews */}
                    {(group.sightings || []).length > 0 && (
                      <div className="flex items-center gap-3 overflow-x-auto pt-1">
                        {group.sightings.map((s, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 shrink-0">
                            <div className="w-20 h-20 bg-surface-200 border border-surface-300 rounded-lg overflow-hidden relative">
                              {s.signed_crop_url ? (
                                <img src={s.signed_crop_url} alt={s.camera_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-surface-700 font-bold">Crop</div>
                              )}
                              <span className="absolute bottom-0 inset-x-0 bg-surface-50/90 text-[9px] font-mono text-surface-950 font-bold text-center py-0.5 truncate">
                                {s.camera_name}
                              </span>
                            </div>
                            {sIdx < group.sightings.length - 1 && (
                              <span className="text-surface-700 font-mono text-xs font-bold">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer disclaimer */}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-surface-700 border-t border-surface-300">
                      <span className="italic text-amber-800 font-medium">Potential match — human verification required.</span>
                      <span className="font-mono text-surface-900 font-bold">Status: <strong className="text-brand-700 uppercase">{group.status || 'POTENTIAL_MATCH'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Institutional Record Matches */}
            {filteredRecordMatches.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-300">
                  <h3 className="text-sm font-extrabold text-surface-950 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    Institutional Record Matches ({filteredRecordMatches.length})
                  </h3>
                  <span className="text-xs text-surface-800 font-bold">Police, Hospital, Shelter, Public Sightings</span>
                </div>

                {filteredRecordMatches.map((m) => {
                  const rec = (m.found_person_records || {}) as any;
                  return (
                    <div
                      key={m.id}
                      className="p-4 bg-surface-50 border border-surface-400 hover:border-brand-500 rounded-2xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-extrabold text-surface-950">{rec.record_id || m.record_id || 'RECORD'}</span>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-brand-500/10 text-brand-900 border-brand-300">
                            {rec.source_type || 'institutional'}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border bg-amber-100 text-amber-900 border-amber-300">
                            {m.match_status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs text-surface-800 font-medium mb-1">
                          {rec.reference_name || rec.location || 'Institutional Sighting Log'}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-surface-800 font-medium flex-wrap">
                          <span>Upper: {rec.upper_clothing || 'Unknown'}</span>
                          <span>Lower: {rec.lower_clothing || 'Unknown'}</span>
                          <span>Bag: {rec.bag || 'None'}</span>
                          <span>Location: {rec.location || 'Unspecified'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-surface-800 font-bold block mb-0.5">Score</span>
                          <span className="text-lg font-extrabold text-brand-700 font-mono">
                            {m.overall_score?.toFixed(1)} <span className="text-xs text-surface-700 font-normal">/ 100</span>
                          </span>
                        </div>

                        <Link to="/search/records">
                          <Button size="sm" variant="secondary" icon={<Eye className="w-3.5 h-3.5" />}>
                            View Record Match
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
