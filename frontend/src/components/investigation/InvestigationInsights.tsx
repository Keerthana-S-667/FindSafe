import React from 'react';
import { CandidateInsight } from '../../services/intelligenceService';
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  insight: CandidateInsight;
}

export const InvestigationInsights: React.FC<Props> = ({ insight }) => {
  return (
    <div className="space-y-6">
      {/* 1. Header Card with Evidence Score */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-700 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-300">Structured Intelligence</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-brand-500/20 text-brand-600 border border-brand-500/40">
                Rule-Based Synthesis
              </span>
            </div>
            <h3 className="text-xl font-bold text-surface-50 mt-1">Investigation Insight Profile</h3>
          </div>

          {/* Evidence Score Pill with Tooltip */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-surface-300 flex items-center justify-end gap-1">
                <span>Evidence Score</span>
                <div className="group relative cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-surface-300" />
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-surface-950 border border-surface-700 rounded text-xs text-surface-100 shadow-xl z-20 font-normal">
                    Combined evidence from appearance, attributes, time, location and cross-source consistency.
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-brand-600">{insight.evidence_score}/100</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-surface-950 border border-surface-700 text-xs font-semibold text-surface-50 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-brand-500" />
              <span>Human Verification Required</span>
            </div>
          </div>
        </div>

        {/* Evidence Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-surface-950 rounded-lg border border-surface-700">
            <div className="text-xs text-surface-300">Camera Sightings</div>
            <div className="text-sm font-semibold text-surface-50 mt-0.5">{insight.camera_count} feeds</div>
          </div>
          <div className="p-3 bg-surface-950 rounded-lg border border-surface-700">
            <div className="text-xs text-surface-300">Record Matches</div>
            <div className="text-sm font-semibold text-surface-50 mt-0.5">{insight.record_count} associated</div>
          </div>
          <div className="p-3 bg-surface-950 rounded-lg border border-surface-700">
            <div className="text-xs text-surface-300">Visual Consistency</div>
            <div className="text-sm font-semibold text-emerald-700 mt-0.5">{insight.visual_evidence}</div>
          </div>
          <div className="p-3 bg-surface-950 rounded-lg border border-surface-700">
            <div className="text-xs text-surface-300">Attribute Consistency</div>
            <div className="text-sm font-semibold text-emerald-700 mt-0.5">{insight.attribute_evidence}</div>
          </div>
          <div className="p-3 bg-surface-950 rounded-lg border border-surface-700">
            <div className="text-xs text-surface-300">Temporal Plausibility</div>
            <div className="text-sm font-semibold text-brand-600 mt-0.5">{insight.temporal_evidence}</div>
          </div>
          <div className="p-3 bg-surface-950 rounded-lg border border-surface-700">
            <div className="text-xs text-surface-300">Spatial Plausibility</div>
            <div className="text-sm font-semibold text-brand-600 mt-0.5">{insight.spatial_evidence}</div>
          </div>
          <div className="p-3 bg-surface-950 rounded-lg border border-surface-700">
            <div className="text-xs text-surface-300">Cross-Camera Evidence</div>
            <div className="text-sm font-semibold text-emerald-700 mt-0.5">{insight.cross_camera_evidence}</div>
          </div>
          <div className="p-3 bg-surface-950 rounded-lg border border-surface-700">
            <div className="text-xs text-surface-300">Cross-Source Evidence</div>
            <div className="text-sm font-semibold text-brand-600 mt-0.5">{insight.cross_source_evidence}</div>
          </div>
        </div>
      </div>

      {/* 2. Why This Candidate Appeared */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-5 shadow-sm">
        <h4 className="text-sm font-bold uppercase tracking-wider text-surface-300 mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-500" />
          <span>Why This Candidate Appeared</span>
        </h4>
        <ul className="space-y-2">
          {insight.why_appeared.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-surface-100">
              <span className="text-brand-500 font-bold">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. Evidence Balance: Supporting Evidence vs Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supporting Evidence Card */}
        <div className="bg-surface-800 border border-emerald-300 rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Supporting Evidence</span>
          </h4>
          <ul className="space-y-2">
            {insight.supporting_evidence.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-surface-100">
                <span className="text-emerald-700 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Limitations / Contradictions Card */}
        <div className="bg-surface-800 border border-amber-300 rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Limitations & Contradictions</span>
          </h4>
          <ul className="space-y-2">
            {insight.limitations.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-surface-100">
                <span className="text-amber-700 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
