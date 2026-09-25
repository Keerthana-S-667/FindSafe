import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { operationsService, ReviewQueueItem } from '../../services/operationsService';
import { ShieldCheck, UserCheck, Lock, Unlock, ArrowRight, Camera, FileText } from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = () => {
    setLoading(true);
    operationsService.getReviewQueue()
      .then((data) => setItems(data))
      .catch((err) => console.error('Error fetching review queue:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleClaim = async (item: ReviewQueueItem) => {
    try {
      await operationsService.claimReviewItem(item.type, item.id, 'investigator@findsafe.gov');
      fetchQueue();
    } catch (err) {
      console.error('Error claiming review:', err);
    }
  };

  const handleRelease = async (item: ReviewQueueItem) => {
    try {
      await operationsService.releaseReviewItem(item.id);
      fetchQueue();
    } catch (err) {
      console.error('Error releasing review:', err);
    }
  };

  return (
    <div className="bg-surface-50 border border-surface-400 rounded-xl p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-300 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-extrabold text-surface-950">Unified Investigator Review Queue</h3>
          </div>
          <p className="text-xs text-surface-700 font-medium mt-0.5">
            Combined queue of multi-camera candidate groups and institutional record matches requiring authorized human verification.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-3 py-1.5 rounded-lg bg-surface-200 border border-surface-300 hover:bg-surface-300 text-xs font-bold text-surface-950 transition-colors"
        >
          Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-surface-700 font-medium text-xs">Loading review queue items...</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-surface-700 font-medium text-xs">No evidence currently requires review.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-surface-200 border border-surface-300 hover:border-brand-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-brand-700">{item.case_code}</span>
                  <span className="text-xs text-surface-700 font-medium">• {item.case_name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.type === 'candidate_group'
                        ? 'bg-sky-100 text-sky-900 border border-sky-300'
                        : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                    }`}
                  >
                    {item.type === 'candidate_group' ? 'CCTV Candidate' : 'Record Match'}
                  </span>
                </div>

                <div className="text-sm font-extrabold text-surface-950 flex items-center gap-2">
                  <span>{item.title}</span>
                  <span className="text-xs font-mono font-extrabold text-brand-700">
                    Score: {item.evidence_score}/100
                  </span>
                </div>

                {item.is_locked && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold pt-0.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Under review by {item.assigned_reviewer}</span>
                  </div>
                )}
              </div>

              {/* Review Actions */}
              <div className="flex items-center gap-2">
                {item.is_locked ? (
                  <button
                    onClick={() => handleRelease(item)}
                    className="px-2.5 py-1 rounded bg-surface-800 border border-surface-700 text-xs text-surface-300 hover:text-surface-50 flex items-center gap-1"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Release</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleClaim(item)}
                    className="px-2.5 py-1 rounded bg-surface-700 hover:bg-surface-600 text-xs text-surface-50 font-medium flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Claim</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (item.type === 'candidate_group') {
                      navigate(`/candidates/${item.id}`);
                    } else {
                      navigate(`/cases/${item.case_id}/investigation?tab=records`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-surface-950 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Inspect Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
