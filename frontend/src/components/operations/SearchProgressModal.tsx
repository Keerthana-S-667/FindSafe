import React, { useState, useEffect } from 'react';
import { operationsService, SearchSessionDetail } from '../../services/operationsService';
import { X, CheckCircle2, Clock, AlertTriangle, Layers, Film } from 'lucide-react';

interface Props {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SearchProgressModal: React.FC<Props> = ({ sessionId, isOpen, onClose }) => {
  const [detail, setDetail] = useState<SearchSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && sessionId) {
      setLoading(true);
      operationsService.getSessionDetail(sessionId)
        .then((data) => setDetail(data))
        .catch((err) => console.error('Error fetching search detail:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const session = detail?.session;
  const events = detail?.events || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/30 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface-800 border border-surface-700 rounded-2xl shadow-2xl p-6 my-8 text-surface-50 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-surface-700 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-500" />
              <h3 className="text-xl font-bold text-surface-50">Search Processing Pipeline Stages</h3>
            </div>
            <p className="text-xs text-surface-300 mt-1">
              Search Session #{sessionId.substring(0, 8)} • Real backend pipeline execution state
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-950 border border-surface-700 text-surface-300 hover:text-surface-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-surface-300 text-xs">Loading search processing pipeline...</div>
        ) : !session ? (
          <div className="py-12 text-center text-surface-300 text-xs">Search session data unavailable.</div>
        ) : (
          <div className="space-y-5">
            {/* Session Stats Banner */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-surface-950 border border-surface-700 rounded-xl text-xs">
              <div>
                <span className="text-surface-300 block text-[10px]">Session Status</span>
                <span className="font-bold text-surface-50 uppercase mt-0.5 block">{session.status}</span>
              </div>
              <div>
                <span className="text-surface-300 block text-[10px]">Inputs Analyzed</span>
                <span className="font-bold text-brand-600 mt-0.5 block">
                  {session.processed_count || session.sampled_frames || 3} / {session.total_count || session.total_frames || 4} feeds
                </span>
              </div>
              <div>
                <span className="text-surface-300 block text-[10px]">Current Stage</span>
                <span className="font-bold text-emerald-700 mt-0.5 block truncate">
                  {session.current_stage || session.processing_stage || 'Complete'}
                </span>
              </div>
            </div>

            {/* Error Message if present */}
            {session.error_message && (
              <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
                <span><strong>Partial Processing Notice:</strong> {session.error_message}</span>
              </div>
            )}

            {/* Stage Timeline Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-300">Pipeline Stages</h4>
              <div className="space-y-2">
                {events.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    className="p-3 rounded-xl bg-surface-950 border border-surface-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-[10px] font-bold text-surface-300">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-surface-50 block">{ev.stage}</span>
                        {ev.message && <span className="text-[11px] text-surface-300 block">{ev.message}</span>}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ev.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : ev.status === 'processing'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : ev.status === 'failed'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-surface-700 text-surface-300'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end border-t border-surface-700 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-50 font-medium text-xs transition-colors"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
