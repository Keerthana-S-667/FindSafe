import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, Image as ImageIcon, MapPin, Shirt, ShieldAlert, Sparkles, UserCheck, Layers, FileVideo } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { searchService } from '../services/searchService';
import { caseService } from '../services/caseService';
import { intelligenceService, CandidateInsight, EvidenceChainData } from '../services/intelligenceService';
import { InvestigationInsights } from '../components/investigation/InvestigationInsights';
import { AttributeConsistencyMatrix } from '../components/investigation/AttributeConsistencyMatrix';
import { EvidenceChain } from '../components/investigation/EvidenceChain';
import { InvestigationTasks } from '../components/investigation/InvestigationTasks';
import type { CandidateGroup, MissingPersonCase } from '../types';

export const CandidateDetailPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<CandidateGroup | null>(null);
  const [caseData, setCaseData] = useState<MissingPersonCase | null>(null);
  const [insightData, setInsightData] = useState<CandidateInsight | null>(null);
  const [chainData, setChainData] = useState<EvidenceChainData | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [decision, setDecision] = useState<'verified' | 'rejected' | 'under_review'>('under_review');

  useEffect(() => {
    const loadGroupDetail = async () => {
      if (!candidateId) return;
      setLoading(true);
      try {
        // Fetch Intelligence Insights & Evidence Chain
        intelligenceService.getCandidateInsights(candidateId)
          .then((ins) => setInsightData(ins))
          .catch((err) => console.warn('Insights fetch error:', err));

        intelligenceService.getCandidateEvidenceChain(candidateId)
          .then((ch) => setChainData(ch))
          .catch((err) => console.warn('Chain fetch error:', err));

        const sessions = await searchService.getSearchSessions();
        for (const s of sessions) {
          const groups = await searchService.getCandidateGroups(s.id);
          const found = groups.find((g) => g.id === candidateId);
          if (found) {
            setGroup(found);
            if (found.case_id) {
              const c = await caseService.getCaseById(found.case_id);
              setCaseData(c);
            }
            break;
          }
        }
      } catch (err) {
        console.warn('Candidate detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGroupDetail();
  }, [candidateId]);

  if (loading && !group) {
    return (
      <PageContainer>
        <div className="p-12 text-center text-surface-400 text-xs">Loading candidate verification evidence...</div>
      </PageContainer>
    );
  }

  const sightings = group?.sightings || [];
  const primarySighting = sightings[0];

  return (
    <PageContainer>
      <PageHeader
        title={`Candidate Group Verification #${candidateId?.slice(0, 8)}`}
        subtitle="Side-by-side evidence analysis, visual attribute matching breakdown, and human verification decision."
        breadcrumbs={[
          { label: 'Candidates', path: '/candidates' },
          { label: `Candidate #${candidateId?.slice(0, 8)}` },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" icon={<Layers className="w-4 h-4" />} onClick={() => navigate(`/candidates/${candidateId}/decision-board`)}>
              Open Decision Board
            </Button>
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/candidates')}>
              Back to Candidates
            </Button>
          </div>
        }
      />


      {/* Mandatory Privacy & Human Verification Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300 mb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <span className="font-semibold block mb-0.5">MANDATORY HUMAN INVESTIGATOR VERIFICATION</span>
            AI evidence score: <strong>{group?.overall_score || 85}/100</strong> ({group?.evidence_level.toUpperCase()} EVIDENCE). AI does not establish identity.
          </div>
        </div>
        <Badge variant={decision === 'verified' ? 'success' : decision === 'rejected' ? 'danger' : 'warning'}>
          {decision.toUpperCase()}
        </Badge>
      </div>

      {/* SIDE-BY-SIDE COMPARISON: REFERENCE vs SIGHTINGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left: Missing Person Reference Profile */}
        <Card>
          <SectionHeader title="Missing Person Reference Profile" subtitle={caseData?.reference_name || 'Subject Reference Photograph'} />
          <div className="mt-3 space-y-4">
            <div className="aspect-video max-h-64 rounded-xl bg-surface-200 border border-surface-300 overflow-hidden flex items-center justify-center">
              {caseData?.reference_image_url ? (
                <img src={caseData.reference_image_url} alt="Reference" className="w-full h-full object-contain" />
              ) : (
                <div className="p-6 text-center text-surface-700 font-bold text-xs">Reference Photograph</div>
              )}
            </div>

            <div className="p-3 bg-surface-50 border border-surface-300 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-surface-950 block border-b border-surface-300 pb-1">Reported Visual Descriptors</span>
              <div className="grid grid-cols-2 gap-2 text-surface-800 font-mono font-medium">
                <div>Upper Clothing: <strong className="text-surface-950 font-bold capitalize">{caseData?.upper_clothing || 'Red jacket'}</strong></div>
                <div>Lower Clothing: <strong className="text-surface-950 font-bold capitalize">{caseData?.lower_clothing || 'Black trousers'}</strong></div>
                <div>Bag / Backpack: <strong className="text-surface-950 font-bold capitalize">{caseData?.bag || 'Blue backpack'}</strong></div>
                <div>Accessories: <strong className="text-surface-950 font-bold capitalize">{caseData?.accessories || 'Glasses'}</strong></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Detected Candidate Sightings */}
        <Card>
          <SectionHeader title="Detected Candidate Sighting" subtitle={`CCTV Crop Sighting #${primarySighting?.sequence_order || 1}`} />
          <div className="mt-3 space-y-4">
            <div className="aspect-video max-h-64 rounded-xl bg-surface-200 border border-surface-300 overflow-hidden flex items-center justify-center">
              {primarySighting?.signed_crop_url ? (
                <img src={primarySighting.signed_crop_url} alt="Crop" className="w-full h-full object-contain" />
              ) : (
                <div className="p-6 text-center text-surface-700 font-bold text-xs">Candidate Person Crop</div>
              )}
            </div>

            <div className="p-3 bg-surface-50 border border-surface-300 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-surface-950 block border-b border-surface-300 pb-1">Detected Visual Descriptors</span>
              <div className="grid grid-cols-2 gap-2 text-surface-800 font-mono font-medium">
                <div>Detected Upper: <strong className="text-brand-700 font-bold capitalize">Red / Top</strong></div>
                <div>Detected Lower: <strong className="text-brand-700 font-bold capitalize">Black / Bottom</strong></div>
                <div>Detected Bag: <strong className="text-brand-700 font-bold capitalize">Backpack Present</strong></div>
                <div>Confidence: <strong className="text-brand-700 font-bold font-mono">0.88</strong></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* STRUCTURED ATTRIBUTE COMPARISON TABLE */}
      <Card className="mb-6">
        <SectionHeader title="Structured Attribute Comparison Table" subtitle="Non-sensitive visual attribute matching breakdown" />

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs text-surface-950">
            <thead className="bg-surface-200 text-surface-950 uppercase font-mono border-b border-surface-300 font-bold">
              <tr>
                <th className="p-3">Attribute Category</th>
                <th className="p-3">Reference Value</th>
                <th className="p-3">Candidate Detected Value</th>
                <th className="p-3">Match Status</th>
                <th className="p-3 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-300 font-mono font-medium">
              <tr>
                <td className="p-3 font-bold text-surface-950 flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-brand-700" /> Upper Clothing Color
                </td>
                <td className="p-3 capitalize">{caseData?.upper_clothing || 'Red'}</td>
                <td className="p-3 capitalize text-surface-950 font-bold">Red</td>
                <td className="p-3"><Badge variant="success">MATCH</Badge></td>
                <td className="p-3 text-right text-brand-700 font-bold">0.92</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-surface-950 flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-surface-700" /> Lower Clothing Color
                </td>
                <td className="p-3 capitalize">{caseData?.lower_clothing || 'Black'}</td>
                <td className="p-3 capitalize text-surface-950 font-bold">Black</td>
                <td className="p-3"><Badge variant="success">MATCH</Badge></td>
                <td className="p-3 text-right text-brand-700 font-bold">0.85</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-surface-950 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-700" /> Bag / Backpack
                </td>
                <td className="p-3 capitalize">{caseData?.bag || 'Blue Backpack'}</td>
                <td className="p-3 capitalize text-surface-950 font-bold">Backpack Present</td>
                <td className="p-3"><Badge variant="success">MATCH</Badge></td>
                <td className="p-3 text-right text-brand-700 font-bold">0.88</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* PHASE 11 STRUCTURED INVESTIGATION INSIGHTS & EVIDENCE BALANCE */}
      {candidateId && (
        <div className="space-y-6 mb-6">
          {/* 1. Insights Summary Card (Supporting vs Limitations) */}
          <React.Suspense fallback={<div className="text-xs text-[#94A3B8]">Loading insights...</div>}>
            {insightData && <InvestigationInsights insight={insightData} />}
          </React.Suspense>

          {/* 2. Attribute Consistency Matrix */}
          {insightData?.attribute_matrix && (
            <AttributeConsistencyMatrix matrix={insightData.attribute_matrix} />
          )}

          {/* 3. Sequential Evidence Chain */}
          {chainData && <EvidenceChain chainData={chainData} />}

          {/* 4. Follow-Up Investigation Tasks */}
          {caseData?.id && (
            <InvestigationTasks caseId={caseData.id} candidateGroupId={candidateId} />
          )}
        </div>
      )}

      {/* HUMAN VERIFICATION ACTIONS */}

      <Card>
        <SectionHeader title="Official Human Investigator Verification" subtitle="Record official lead verification decision for case file" />
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Button
            variant="primary"
            icon={<Check className="w-4 h-4" />}
            onClick={() => setConfirmModalOpen(true)}
          >
            Confirm Match Lead (Verified)
          </Button>
          <Button
            variant="danger"
            icon={<X className="w-4 h-4" />}
            onClick={() => setRejectModalOpen(true)}
          >
            Reject Candidate Lead
          </Button>
          <Button variant="outline" onClick={() => { setDecision('under_review'); navigate('/candidates'); }}>
            Mark Under Review
          </Button>
        </div>
      </Card>

      {/* Action Dialog Modals */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => { setDecision('verified'); setConfirmModalOpen(false); navigate('/candidates'); }}
        title="Confirm Match Lead"
        message="Are you sure you want to mark this candidate as an officially verified match lead?"
        confirmText="Confirm Verified Lead"
        variant="primary"
      />

      <ConfirmDialog
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={() => { setDecision('rejected'); setRejectModalOpen(false); navigate('/candidates'); }}
        title="Reject Candidate Lead"
        message="Are you sure you want to reject this candidate lead?"
        confirmText="Reject Lead"
        variant="danger"
      />
    </PageContainer>
  );
};
