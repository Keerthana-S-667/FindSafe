import React, { useState, useEffect } from 'react';
import { operationsService, HandoffSummaryData } from '../../services/operationsService';
import { X, FileText, UserCheck, CheckSquare, ShieldAlert, ArrowRight } from 'lucide-react';

interface Props {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const HandoffSummaryModal: React.FC<Props> = ({ caseId, isOpen, onClose }) => {
  const [handoff, setHandoff] = useState<HandoffSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [handoffNote, setHandoffNote] = useState('');

  useEffect(() => {
    if (isOpen && caseId) {
      setLoading(true);
      operationsService.getCaseHandoff(caseId)
        .then((data) => setHandoff(data))
        .catch((err) => console.error('Error fetching handoff:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, caseId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/30 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface-800 border border-surface-700 rounded-2xl shadow-2xl p-6 my-8 text-surface-50 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-surface-700 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              <h3 className="text-xl font-bold text-surface-50">Investigator Handoff Summary</h3>
            </div>
            <p className="text-xs text-surface-300 mt-1">
              Case status snapshot for shift handoff and investigator reassignment.
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
          <div className="py-12 text-center text-surface-300 text-xs">Compiling handoff summary...</div>
        ) : !handoff ? (
          <div className="py-12 text-center text-surface-300 text-xs">Handoff summary unavailable.</div>
        ) : (
          <div className="space-y-5">
            {/* Case Overview Pill */}
            <div className="p-4 bg-surface-950 border border-surface-700 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-brand-600">{handoff.case_code}</span>
                  <span className="text-sm font-bold text-surface-50">• {handoff.full_name}</span>
                </div>
                <div className="text-xs text-surface-300 mt-1">
                  Lead Investigator: <strong>{handoff.assigned_investigator}</strong>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-surface-700 text-xs font-bold uppercase text-surface-50">
                {handoff.status}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-surface-950 border border-surface-700 rounded-lg">
                <span className="text-surface-300 block text-[10px]">Searches Completed</span>
                <span className="text-lg font-bold text-surface-50 block mt-0.5">{handoff.searches_completed}</span>
              </div>
              <div className="p-3 bg-surface-950 border border-surface-700 rounded-lg">
                <span className="text-surface-300 block text-[10px]">Candidates Detected</span>
                <span className="text-lg font-bold text-brand-600 block mt-0.5">{handoff.candidates_detected}</span>
              </div>
              <div className="p-3 bg-surface-950 border border-surface-700 rounded-lg">
                <span className="text-surface-300 block text-[10px]">Pending Tasks</span>
                <span className="text-lg font-bold text-emerald-700 block mt-0.5">{handoff.open_tasks_count}</span>
              </div>
            </div>

            {/* Structured Handoff Bullets */}
            <div className="p-4 bg-surface-950 border border-surface-700 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-300 mb-2">Structured Case Summary</h4>
              <ul className="space-y-1.5 text-xs text-surface-100">
                {handoff.summary_bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-500 font-bold mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Investigator Handoff Note Input */}
            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1">Add Investigator Shift Handoff Note</label>
              <textarea
                rows={3}
                placeholder="e.g. Camera 04 requires manual review due to partial visibility."
                value={handoffNote}
                onChange={(e) => setHandoffNote(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded-lg p-3 text-xs text-surface-50 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-surface-700 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-50 font-medium text-xs transition-colors"
          >
            Close Handoff Summary
          </button>
        </div>
      </div>
    </div>
  );
};
