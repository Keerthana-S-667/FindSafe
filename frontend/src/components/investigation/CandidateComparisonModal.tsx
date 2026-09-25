import React, { useState, useEffect } from 'react';
import { intelligenceService, CandidateInsight } from '../../services/intelligenceService';
import { X, ShieldAlert, CheckCircle2, Columns } from 'lucide-react';

interface Props {
  candidateIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateComparisonModal: React.FC<Props> = ({ candidateIds, isOpen, onClose }) => {
  const [insights, setInsights] = useState<CandidateInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && candidateIds.length > 0) {
      setLoading(true);
      setError(null);
      intelligenceService.compareCandidates(candidateIds)
        .then((data) => {
          setInsights(data);
        })
        .catch((err) => {
          console.error('Error fetching comparison:', err);
          setError('Failed to load candidate comparison insights.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, candidateIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/30 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-surface-800 border border-surface-700 rounded-2xl shadow-2xl p-6 my-8 text-surface-50 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-surface-700 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Columns className="w-5 h-5 text-brand-500" />
              <h3 className="text-xl font-bold text-surface-50">Candidate Group Comparison</h3>
            </div>
            <p className="text-xs text-surface-300 mt-1">
              Side-by-side evidence analysis for human investigator evaluation. Equal visual treatment enforced.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-950 border border-surface-700 text-surface-300 hover:text-surface-50 hover:bg-surface-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-surface-300 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Evaluating multi-candidate evidence parameters...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-rose-700 bg-rose-100 border border-rose-300 rounded-xl">
            {error}
          </div>
        ) : insights.length === 0 ? (
          <div className="py-8 text-center text-surface-300">Select at least 2 candidate groups to compare.</div>
        ) : (
          <div className="overflow-x-auto">
            {/* Comparison Grid */}
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-surface-700 bg-surface-950">
                  <th className="py-3 px-4 text-xs font-bold text-surface-300 uppercase w-48">Evidence Metric</th>
                  {insights.map((item, idx) => (
                    <th key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center w-1/4">
                      <div className="text-xs text-surface-300 uppercase">Candidate Group</div>
                      <div className="text-base font-bold text-surface-50 mt-0.5">
                        Group {idx + 1} (#{item.candidate_group_id.substring(0, 6)})
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700 text-sm">
                {/* 1. Evidence Score */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Evidence Score</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center">
                      <span className="text-lg font-bold text-brand-600">{item.evidence_score}/100</span>
                    </td>
                  ))}
                </tr>

                {/* 2. Review Status */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Review Status</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center">
                      <span className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-950 border border-surface-700 text-surface-100">
                        {item.review_status}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 3. Camera Count */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Camera Feeds</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center">
                      {item.camera_count} feeds
                    </td>
                  ))}
                </tr>

                {/* 4. Record Matches */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Record Matches</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center">
                      {item.record_count} associated
                    </td>
                  ))}
                </tr>

                {/* 5. Visual Consistency */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Visual Consistency</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center font-medium text-emerald-700">
                      {item.visual_evidence}
                    </td>
                  ))}
                </tr>

                {/* 6. Attribute Consistency */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Attribute Match</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center font-medium text-emerald-700">
                      {item.attribute_evidence}
                    </td>
                  ))}
                </tr>

                {/* 7. Temporal Consistency */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Temporal Consistency</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center text-brand-600">
                      {item.temporal_evidence}
                    </td>
                  ))}
                </tr>

                {/* 8. Spatial Consistency */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Spatial Consistency</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center text-brand-600">
                      {item.spatial_evidence}
                    </td>
                  ))}
                </tr>

                {/* 9. Cross-Source Evidence */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Cross-Source Linkage</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-center text-surface-100">
                      {item.cross_source_evidence}
                    </td>
                  ))}
                </tr>

                {/* 10. Key Difference / Explanation */}
                <tr className="hover:bg-surface-950/40">
                  <td className="py-3 px-4 font-semibold text-surface-50">Primary Strengths</td>
                  {insights.map((item) => (
                    <td key={item.candidate_group_id} className="py-3 px-4 border-l border-surface-700 text-xs text-surface-300">
                      <ul className="space-y-1 text-left list-disc list-inside">
                        {item.supporting_evidence.slice(0, 2).map((s, sIdx) => (
                          <li key={sIdx}>{s}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div className="flex items-center justify-between border-t border-surface-700 pt-4 text-xs text-surface-300">
          <div className="flex items-center gap-1.5 text-amber-700">
            <ShieldAlert className="w-4 h-4" />
            <span>AI provides evidence comparison. The authorized investigator decides identity.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-50 font-medium transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
