import React from 'react';
import { Camera, Clock, Layers, Ban, Eye, Video } from 'lucide-react';

interface Props {
  session: any;
  onViewStages: (sessionId: string) => void;
  onCancelSearch: (sessionId: string) => void;
}

export const ActiveSearchCard: React.FC<Props> = ({ session, onViewStages, onCancelSearch }) => {
  const caseCode = session.cases?.case_id || session.case_id || 'MP-CASE';
  const caseName = session.cases?.full_name || 'Missing Person';
  const status = session.status || 'processing';
  const stage = session.current_stage || session.processing_stage || 'Processing';
  const processed = session.processed_count || session.sampled_frames || 3;
  const total = session.total_count || session.total_frames || 4;

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Completed</span>;
      case 'partial':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">Partially Completed</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">Failed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-700 text-surface-300">Cancelled</span>;
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-500/20 text-brand-700 border border-brand-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-ping"></span>
            Processing
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-50 border border-surface-400 rounded-xl p-5 hover:border-brand-500 transition-all duration-200 shadow-xs">
      <div className="flex items-start justify-between gap-3 border-b border-surface-300 pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-brand-700">{caseCode}</span>
            <span className="text-xs text-surface-700 font-medium">• {caseName}</span>
          </div>
          <h4 className="text-sm font-extrabold text-surface-950 mt-0.5 truncate max-w-[220px]">
            Search #{session.id.substring(0, 8)}
          </h4>
        </div>
        {getStatusBadge(status)}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="p-2.5 bg-surface-200 rounded-lg border border-surface-300">
          <span className="text-surface-700 block text-[10px] font-bold uppercase">Current Stage</span>
          <span className="font-extrabold text-surface-950 truncate block mt-0.5">{stage}</span>
        </div>

        <div className="p-2.5 bg-surface-200 rounded-lg border border-surface-300">
          <span className="text-surface-700 block text-[10px] font-bold uppercase">Inputs Processed</span>
          <span className="font-extrabold text-brand-700 block mt-0.5 font-mono">{processed} / {total} feeds</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-surface-300">
        <span className="text-surface-700 font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-surface-700" />
          {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        <div className="flex items-center gap-2">
          {['queued', 'processing', 'uploading'].includes(status) && (
            <button
              onClick={() => onCancelSearch(session.id)}
              className="px-2.5 py-1 rounded-lg bg-surface-200 border border-surface-300 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Ban className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={() => onViewStages(session.id)}
            className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-amber-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Stages</span>
          </button>
        </div>
      </div>
    </div>
  );
};
