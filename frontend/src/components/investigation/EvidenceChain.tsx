import React from 'react';
import { EvidenceChainData, ChainNode } from '../../services/intelligenceService';
import { ArrowDown, Camera, FileText, User, MapPin, Clock, Info } from 'lucide-react';

interface Props {
  chainData: EvidenceChainData;
}

export const EvidenceChain: React.FC<Props> = ({ chainData }) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'reference':
        return <User className="w-4 h-4 text-[#E0A96D]" />;
      case 'camera_sighting':
        return <Camera className="w-4 h-4 text-sky-400" />;
      case 'record_match':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-surface-700 pb-4 mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-300">Sequential Evidence Linkage</span>
          <h3 className="text-lg font-bold text-surface-50 mt-0.5">{chainData.title || 'Potential Evidence Sequence'}</h3>
        </div>
        <div className="px-3 py-1 rounded bg-surface-950 border border-surface-700 text-xs text-surface-300">
          Potential sequence • Does not imply confirmed physical movement
        </div>
      </div>

      {/* Chain Vertical Flow */}
      <div className="flex flex-col items-center space-y-3">
        {chainData.nodes.map((node: ChainNode, idx: number) => (
          <React.Fragment key={node.id}>
            {/* Node Card */}
            <div className="w-full max-w-xl bg-surface-950 border border-surface-700 rounded-xl p-4 hover:border-brand-500 transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-surface-800 border border-surface-700">
                    {getNodeIcon(node.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-surface-50">{node.source}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-700 text-surface-50">
                        {node.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-300 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-surface-300" />
                        {node.timestamp}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-surface-300" />
                        {node.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Pill & Optional Image */}
                <div className="flex items-center gap-3">
                  {node.image_path && (
                    <img
                      src={node.image_path.startsWith('http') ? node.image_path : `/api/storage/${node.image_path}`}
                      alt="Crop evidence"
                      className="w-12 h-12 rounded object-cover border border-surface-700"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="text-right">
                    <div className="text-[10px] text-surface-300">Score</div>
                    <div className="text-sm font-bold text-brand-600">{node.evidence_score}/100</div>
                  </div>
                </div>
              </div>

              {/* Transition Info if available */}
              {(node.transition_time || node.transition_distance) && (
                <div className="mt-3 pt-2 border-t border-surface-700 flex items-center justify-between text-xs text-surface-300">
                  <span>Transition Time: ~{node.transition_time}s</span>
                  <span>Spatial Distance: ~{node.transition_distance}m</span>
                </div>
              )}
            </div>

            {/* Connector Arrow if not last item */}
            {idx < chainData.nodes.length - 1 && (
              <div className="flex flex-col items-center py-1">
                <ArrowDown className="w-5 h-5 text-brand-500 animate-bounce" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
