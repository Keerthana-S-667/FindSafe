import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Shield, Eye, AlertTriangle, CheckCircle2, UserCheck, ArrowLeft, Printer, 
  Sparkles, Layers, MapPin, Clock, FileText, Camera, Globe, Users, FileDown, 
  HelpCircle, RefreshCw, Sliders, CheckSquare, Zap, Activity, Info, XCircle
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { decisionBoardService, type DecisionBoardPayload } from '../services/decisionBoardService';

const boardMarkerIcon = L.divIcon({
  className: 'custom-board-marker',
  html: `<div style="background-color: #0EA5E9; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.5); font-weight: bold; font-size: 12px;">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

export const DecisionBoardPage: React.FC = () => {
  const { caseId, candidateId } = useParams<{ caseId?: string; candidateId?: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<DecisionBoardPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [judgeView, setJudgeView] = useState<boolean>(false);
  const [printView, setPrintView] = useState<boolean>(false);

  // Review Decision State
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [selectedDecision, setSelectedDecision] = useState<string>('potential_match');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [updatingReview, setUpdatingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDecisionBoardData();
  }, [caseId, candidateId]);

  const loadDecisionBoardData = async () => {
    setLoading(true);
    try {
      let res: DecisionBoardPayload;
      if (candidateId) {
        res = await decisionBoardService.getCandidateDecisionBoard(candidateId);
      } else if (caseId) {
        res = await decisionBoardService.getCaseDecisionBoard(caseId);
      } else {
        res = await decisionBoardService.getCandidateDecisionBoard('CG-DEMO-01');
      }
      setData(res);
    } catch (err) {
      console.warn('Error loading Decision Board data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!data) return;
    setUpdatingReview(true);
    try {
      await decisionBoardService.updateReviewDecision(
        data.header.candidate_id, 
        selectedDecision, 
        reviewNotes
      );
      setReviewSuccessMsg(`Review status updated to '${selectedDecision.replace('_', ' ').toUpperCase()}'.`);
      setShowReviewModal(false);
      await loadDecisionBoardData();
    } catch (err) {
      console.warn('Update review error:', err);
    } finally {
      setUpdatingReview(false);
      setTimeout(() => setReviewSuccessMsg(null), 4000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-surface-300">Synthesizing Investigation Evidence Decision Board...</p>
        </div>
      </PageContainer>
    );
  }

  const header = data?.header;
  const metrics = data?.summary_metrics;
  const mapCoords: [number, number][] = (data?.map_locations || []).map(m => [m.lat, m.lng]);

  return (
    <PageContainer>
      {/* 1. DECISION BOARD HEADER */}
      <div className="bg-surface-50 border border-surface-400 rounded-2xl p-6 mb-6 shadow-xs space-y-4 print:bg-white print:text-black print:border-gray-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-300 pb-4 print:border-gray-300">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-7 h-7 text-brand-600 shrink-0 print:text-gray-900" />
              <h1 className="text-2xl font-black text-surface-950 tracking-tight print:text-black">
                INVESTIGATION DECISION BOARD
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold uppercase bg-brand-500/15 text-brand-800 border border-brand-500/30 rounded-md print:bg-gray-100 print:text-gray-900">
                CASE: {header?.case_id}
              </span>
            </div>
            <p className="text-xs text-surface-700 font-medium print:text-gray-600">
              {header?.disclaimer}
            </p>
          </div>

          {!printView && (
            <div className="flex items-center gap-2 print:hidden">
              <Button 
                size="sm" 
                variant={judgeView ? 'primary' : 'secondary'}
                onClick={() => setJudgeView(!judgeView)}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                {judgeView ? 'Exit Judge View' : 'Judge View'}
              </Button>
              <Button size="sm" variant="secondary" onClick={handlePrint} icon={<Printer className="w-3.5 h-3.5" />}>
                Print Brief
              </Button>
              <Button size="sm" variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back
              </Button>
            </div>
          )}
        </div>

        {/* Case & Candidate Meta Context */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div>
            <span className="text-[10px] text-surface-700 font-extrabold uppercase block print:text-gray-500">Candidate Group</span>
            <span className="font-mono font-extrabold text-brand-700 print:text-black">{header?.candidate_id}</span>
          </div>
          <div>
            <span className="text-[10px] text-surface-700 font-extrabold uppercase block print:text-gray-500">Subject Reference</span>
            <span className="font-extrabold text-surface-950 print:text-black">{header?.reference_name}</span>
          </div>
          <div>
            <span className="text-[10px] text-surface-700 font-extrabold uppercase block print:text-gray-500">Review Status</span>
            <span className="font-extrabold text-amber-800 uppercase font-mono print:text-black">{header?.review_status}</span>
          </div>
          <div>
            <span className="text-[10px] text-surface-700 font-extrabold uppercase block print:text-gray-500">Assigned Reviewer</span>
            <span className="font-extrabold text-surface-950 print:text-black">{header?.assigned_reviewer}</span>
          </div>
        </div>
      </div>

      {reviewSuccessMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-900 text-xs font-bold mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          {reviewSuccessMsg}
        </div>
      )}

      {/* 2. EXECUTIVE EVIDENCE SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs print:bg-white print:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block print:text-gray-600">Evidence Score</span>
            <span title="Combined evidence from configured visual, attribute, time, location and cross-source factors. It is NOT an identity probability.">
              <Info className="w-3.5 h-3.5 text-brand-600 cursor-pointer" />
            </span>
          </div>
          <span className="text-2xl font-black text-brand-700 font-mono print:text-black">{metrics?.evidence_score_display}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs print:bg-white print:border-gray-300">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block print:text-gray-600">Camera Feeds</span>
          <span className="text-2xl font-extrabold text-brand-700 font-mono print:text-black">{metrics?.camera_sources_count}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs print:bg-white print:border-gray-300">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block print:text-gray-600">Records Associated</span>
          <span className="text-2xl font-extrabold text-indigo-700 font-mono print:text-black">{metrics?.record_associations_count}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs print:bg-white print:border-gray-300">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block print:text-gray-600">Supporting Facts</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono print:text-black">{metrics?.supporting_evidence_count}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs print:bg-white print:border-gray-300">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block print:text-gray-600">Limitations</span>
          <span className="text-2xl font-extrabold text-amber-700 font-mono print:text-black">{metrics?.limitations_count}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs print:bg-white print:border-gray-300">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block print:text-gray-600">Decision State</span>
          <span className="text-lg font-extrabold text-amber-800 font-mono uppercase block print:text-black">{metrics?.review_status}</span>
        </div>
      </div>

      {/* JUDGE VIEW STORYBOARD PANEL */}
      {judgeView && (
        <Card className="mb-6 bg-brand-500/15 border-brand-500/30">
          <div className="flex items-center gap-2 border-b border-brand-500/30 pb-3 mb-3">
            <Sparkles className="w-5 h-5 text-brand-700" />
            <h2 className="text-sm font-extrabold text-brand-900 uppercase tracking-wider">
              JUDGE PRESENTATION VIEW • DEMO SYNTHETIC INVESTIGATION
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
              <span className="font-extrabold text-brand-800 block uppercase text-[10px]">1. Problem</span>
              <p className="text-surface-900 text-[11px] font-medium">
                Missing person evidence is fragmented across multiple camera CCTV feeds and institutional shelter records.
              </p>
            </div>
            <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
              <span className="font-extrabold text-emerald-800 block uppercase text-[10px]">2. FindSafe AI Solution</span>
              <p className="text-surface-900 text-[11px] font-medium">
                Fuses non-sensitive visual attributes, time, location, and records into one transparent, human-verified Decision Board.
              </p>
            </div>
            <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
              <span className="font-extrabold text-sky-800 block uppercase text-[10px]">3. Key Differentiator</span>
              <p className="text-surface-900 text-[11px] font-medium">
                No facial recognition or biometric identification. Human verification remains 100% authoritative.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 3. BALANCED EVIDENCE GRID (SUPPORTING VS LIMITATIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* SUPPORTING EVIDENCE COLUMN */}
        <Card className="border-emerald-500/30">
          <div className="flex items-center justify-between border-b border-surface-300 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <h2 className="text-sm font-extrabold text-surface-950 uppercase tracking-wider">
                SUPPORTING EVIDENCE ({data?.supporting_evidence.length})
              </h2>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 rounded uppercase">
              CONFIRMED DESCRIPTORS
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {(data?.supporting_evidence || []).map((item) => (
              <div key={item.id} className="p-3 bg-surface-50 border border-surface-400 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-emerald-800 font-mono text-[11px] uppercase">{item.category}</span>
                  <span className="text-surface-700 text-[10px] font-medium">{item.timestamp}</span>
                </div>
                <p className="text-surface-950 text-[11px] font-medium leading-relaxed">{item.explanation}</p>
                <div className="flex justify-between items-center text-[10px] text-surface-700 pt-1 border-t border-surface-300 font-medium">
                  <span>Source: <strong className="text-surface-950">{item.source}</strong></span>
                  <span>Location: <strong className="text-surface-950">{item.location}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* EVIDENCE LIMITATIONS & UNCERTAINTIES COLUMN */}
        <Card className="border-amber-500/30">
          <div className="flex items-center justify-between border-b border-surface-300 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
              <h2 className="text-sm font-extrabold text-surface-950 uppercase tracking-wider">
                LIMITATIONS & UNCERTAINTIES ({data?.limitations.length})
              </h2>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-amber-500/15 text-amber-900 border border-amber-500/30 rounded uppercase">
              UNRESOLVED FACTORS
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {(data?.limitations || []).map((item) => (
              <div key={item.id} className="p-3 bg-surface-50 border border-surface-400 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-amber-800 font-mono text-[11px] uppercase">{item.category}</span>
                  <span className="text-surface-700 text-[10px] font-medium">Source: {item.source}</span>
                </div>
                <p className="text-surface-950 text-[11px] font-medium leading-relaxed">{item.explanation}</p>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* 4. EVIDENCE CONTRIBUTION BREAKDOWN & ATTRIBUTE CONSISTENCY MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* EVIDENCE DIMENSIONS BREAKDOWN */}
        <Card>
          <SectionHeader title="Evidence Contribution" subtitle="Dimension score weightings (Not an identity probability)" />
          <div className="space-y-3 mt-4 text-xs">
            {(data?.evidence_breakdown || []).map((b) => (
              <div key={b.dimension} className="space-y-1">
                <div className="flex justify-between font-bold text-surface-800">
                  <span>{b.dimension}</span>
                  <span className="font-mono font-extrabold text-brand-700">{b.score}/100</span>
                </div>
                <div className="w-full h-2 bg-surface-300 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-600 transition-all duration-500"
                    style={{ width: `${b.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ATTRIBUTE CONSISTENCY MATRIX (2 COLS) */}
        <Card className="lg:col-span-2">
          <SectionHeader title="Attribute Consistency Matrix" subtitle="Comparison across reference profile, camera detections & records" />
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-300 text-surface-700 font-bold">
                  <th className="py-2">Attribute</th>
                  <th className="py-2">Reference Profile</th>
                  <th className="py-2">CAM-01 Entrance</th>
                  <th className="py-2">CAM-02 Platform</th>
                  <th className="py-2">CAM-04 Exit</th>
                  <th className="py-2">Shelter Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-300 text-surface-950 font-medium">
                {(data?.attribute_matrix || []).map((row) => (
                  <tr key={row.attribute}>
                    <td className="py-2.5 font-extrabold text-surface-950">{row.attribute}</td>
                    <td className="py-2.5 font-mono text-brand-700 font-extrabold">{row.reference}</td>
                    <td className="py-2.5 text-emerald-800 font-bold">{row.cam_01}</td>
                    <td className="py-2.5 text-emerald-800 font-bold">{row.cam_02}</td>
                    <td className="py-2.5 text-sky-800 font-bold">{row.cam_04}</td>
                    <td className="py-2.5 text-indigo-800 font-bold">{row.record}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      {/* 5. GIS MAP & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* GIS POTENTIAL SEQUENCE MAP (2 COLS) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-surface-300 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-surface-950 uppercase tracking-wider">
                POTENTIAL EVIDENCE SEQUENCE MAP
              </h3>
              <p className="text-xs text-surface-700 font-medium">
                Camera order represents a potential evidence sequence and does not confirm physical movement between locations.
              </p>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-surface-200 text-surface-900 border border-surface-300 rounded">
              POTENTIAL SEQUENCE
            </span>
          </div>

          <div className="h-72 rounded-xl overflow-hidden border border-surface-300 z-0 shadow-xs">
            <MapContainer 
              center={[12.9740, 77.5970]} 
              zoom={13} 
              style={{ height: '100%', width: '100%', backgroundColor: '#FAF5EE' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapCoords.length > 1 && (
                <Polyline 
                  positions={mapCoords} 
                  pathOptions={{ color: '#0EA5E9', weight: 3, dashArray: '6, 6' }} 
                />
              )}
              {(data?.map_locations || []).map((m) => (
                <Marker key={m.name} position={[m.lat, m.lng]} icon={boardMarkerIcon}>
                  <Popup className="text-xs">
                    <strong className="block text-surface-950 font-bold">{m.name}</strong>
                    <span className="text-surface-700 text-[10px] block">{m.type} ({m.time})</span>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>

        {/* HUMAN REVIEW & DECISION PANEL */}
        <Card>
          <SectionHeader title="Human Review Decision" subtitle="Authorized reviewer verification state" />
          <div className="space-y-4 mt-4 text-xs">
            <div className="p-3.5 bg-surface-50 border border-surface-400 rounded-xl space-y-2 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-surface-700 font-extrabold">Status:</span>
                <span className="font-mono font-extrabold text-amber-800 uppercase">{data?.human_review.review_status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-surface-700 font-extrabold">Reviewer:</span>
                <span className="font-extrabold text-surface-950">{data?.human_review.reviewer}</span>
              </div>
              <p className="text-[11px] text-surface-800 italic font-medium pt-1 border-t border-surface-300">
                "{data?.human_review.notes}"
              </p>
            </div>

            {!printView && (
              <Button 
                variant="primary" 
                className="w-full justify-center text-xs" 
                onClick={() => setShowReviewModal(true)}
                icon={<UserCheck className="w-4 h-4" />}
              >
                Update Review Decision
              </Button>
            )}

            {/* NEXT ACTIONS */}
            <div className="pt-2 space-y-2 border-t border-surface-300">
              <span className="text-[10px] text-surface-700 font-extrabold uppercase block">Next Investigator Actions</span>
              <div className="space-y-1.5">
                <Link to={`/cases/${header?.case_id}/investigation`} className="block">
                  <Button variant="secondary" className="w-full justify-start text-[11px]" icon={<Eye className="w-3.5 h-3.5" />}>
                    Open Investigation Workspace
                  </Button>
                </Link>
                <Link to={`/cases/${header?.case_id}/replay`} className="block">
                  <Button variant="secondary" className="w-full justify-start text-[11px]" icon={<Clock className="w-3.5 h-3.5" />}>
                    Open Investigation Replay
                  </Button>
                </Link>
                <Link to="/reports" className="block">
                  <Button variant="secondary" className="w-full justify-start text-[11px]" icon={<FileDown className="w-3.5 h-3.5" />}>
                    Generate PDF Report
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* UPDATE REVIEW DECISION MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-amber-950/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-50 border border-surface-400 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-300 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-600" />
                <h3 className="font-extrabold text-surface-950 text-base">Record Human Review Decision</h3>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-surface-700 hover:text-surface-950 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-surface-800 font-bold block mb-1">Select Authorized Decision:</label>
                <select 
                  value={selectedDecision} 
                  onChange={(e) => setSelectedDecision(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-400 text-surface-950 rounded-xl p-2.5 focus:outline-none focus:border-brand-500 font-medium"
                >
                  <option value="under_review">Under Review</option>
                  <option value="potential_match">Potential Match</option>
                  <option value="rejected">Rejected / Mismatch</option>
                  <option value="verified">Verified by Authorized Reviewer</option>
                </select>
              </div>

              <div>
                <label className="text-surface-800 font-bold block mb-1">Reviewer Notes / Rationale:</label>
                <textarea 
                  rows={3} 
                  value={reviewNotes} 
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter notes explaining the rationale for this decision..."
                  className="w-full bg-surface-50 border border-surface-400 text-surface-950 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <p className="text-[11px] text-amber-900 font-medium italic">
                Note: Decision will be logged permanently into the investigation audit history.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleUpdateReview} disabled={updatingReview}>
                {updatingReview ? 'Recording...' : 'Confirm Decision'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
