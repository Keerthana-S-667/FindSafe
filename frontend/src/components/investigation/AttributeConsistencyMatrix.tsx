import React from 'react';
import { CandidateInsight } from '../../services/intelligenceService';

interface Props {
  matrix: CandidateInsight['attribute_matrix'];
}

export const AttributeConsistencyMatrix: React.FC<Props> = ({ matrix }) => {
  if (!matrix || matrix.length === 0) {
    return null;
  }

  // Extract unique camera names for column headers
  const cameras = matrix[0]?.sightings?.map((s) => s.camera) || ['Cam 01', 'Cam 02'];

  const getStatusBadge = (status: 'Match' | 'Partial' | 'Unknown' | 'Mismatch') => {
    switch (status) {
      case 'Match':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Match</span>;
      case 'Partial':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Partial</span>;
      case 'Mismatch':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Mismatch</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-700 text-surface-300 border border-surface-600">Unknown</span>;
    }
  };

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-300">Attribute Cross-Verification</span>
          <h3 className="text-lg font-bold text-surface-50">Attribute Consistency Matrix</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-300">
          <span className="w-2 h-2 rounded-full bg-emerald-700 inline-block"></span> Match
          <span className="w-2 h-2 rounded-full bg-amber-700 inline-block ml-2"></span> Partial
          <span className="w-2 h-2 rounded-full bg-surface-400 inline-block ml-2"></span> Unknown
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-700 bg-surface-950 text-xs font-bold text-surface-300 uppercase tracking-wider">
              <th className="py-3 px-4">Attribute</th>
              <th className="py-3 px-4 border-l border-surface-700">Reference Profile</th>
              {cameras.map((cam, idx) => (
                <th key={idx} className="py-3 px-4 border-l border-surface-700 text-center">
                  {cam}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700 text-sm text-surface-100">
            {matrix.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-surface-950/40 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-surface-50">{row.attribute}</td>
                <td className="py-3.5 px-4 border-l border-surface-700 text-brand-600 font-medium bg-surface-950/30">
                  {row.reference}
                </td>
                {row.sightings.map((s, cIdx) => (
                  <td key={cIdx} className="py-3.5 px-4 border-l border-surface-700 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-surface-100 font-medium">{s.value}</span>
                      {getStatusBadge(s.status)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
