import React, { useState, useEffect } from 'react';
import { intelligenceService, EvidenceGraphData, GraphNode } from '../../services/intelligenceService';
import { Network, Filter, User, Camera, FileText, Layers } from 'lucide-react';

interface Props {
  caseId: string;
}

export const EvidenceGraph: React.FC<Props> = ({ caseId }) => {
  const [graphData, setGraphData] = useState<EvidenceGraphData | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (caseId) {
      setLoading(true);
      intelligenceService.getCaseEvidenceGraph(caseId, filterType)
        .then((data) => setGraphData(data))
        .catch((err) => console.error('Error fetching evidence graph:', err))
        .finally(() => setLoading(false));
    }
  }, [caseId, filterType]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'missing_person':
        return <User className="w-5 h-5 text-[#E0A96D]" />;
      case 'camera_sighting':
        return <Camera className="w-5 h-5 text-sky-400" />;
      case 'record':
      case 'Hospital':
      case 'Shelter':
      case 'Police':
        return <FileText className="w-5 h-5 text-emerald-400" />;
      default:
        return <Layers className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 shadow-sm space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-bold text-surface-50">Case Evidence Relationship Graph</h3>
          </div>
          <p className="text-xs text-surface-300 mt-0.5">
            Interactive 2D relationship map connecting missing person, camera sightings, records, and candidate groups.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-surface-300 mr-1 hidden sm:inline" />
          {['all', 'Camera', 'Police', 'Hospital', 'Shelter', 'Candidate'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                filterType === cat
                  ? 'bg-brand-500 text-surface-950 font-bold'
                  : 'bg-surface-950 border border-surface-700 text-surface-300 hover:text-surface-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-surface-300">Loading evidence graph relationships...</div>
      ) : !graphData || graphData.nodes.length === 0 ? (
        <div className="py-12 text-center text-surface-300">No evidence nodes recorded yet.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2D Interactive Node Grid */}
          <div className="lg:col-span-2 bg-surface-950 border border-surface-700 rounded-xl p-6 min-h-[340px] flex flex-col justify-center">
            {/* Simple centered graph layout */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-4">
              {graphData.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-xl border transition-all duration-200 text-left flex items-start gap-3 w-64 shadow-md ${
                      isSelected
                        ? 'bg-surface-800 border-brand-500 ring-2 ring-brand-500/30'
                        : 'bg-surface-800/80 border-surface-700 hover:border-brand-500'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-surface-950 border border-surface-700">
                      {getNodeIcon(node.type)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-surface-300 uppercase tracking-wider">{node.category}</div>
                      <div className="text-sm font-bold text-surface-50 truncate max-w-[150px]">{node.label}</div>
                      <div className="text-[11px] text-brand-600 mt-0.5">{node.detail}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Node Inspector Detail Panel */}
          <div className="bg-surface-950 border border-surface-700 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-300 mb-3">Node Inspector</h4>
              {selectedNode ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-surface-800 border border-surface-700">
                    <div className="text-xs text-surface-300">Entity Type</div>
                    <div className="text-sm font-bold text-surface-50 capitalize">{selectedNode.category}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-800 border border-surface-700">
                    <div className="text-xs text-surface-300">Label</div>
                    <div className="text-sm font-bold text-brand-600">{selectedNode.label}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-800 border border-surface-700">
                    <div className="text-xs text-surface-300">Details / Context</div>
                    <div className="text-sm text-surface-100">{selectedNode.detail}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-800 border border-surface-700">
                    <div className="text-xs text-surface-300">Potential Relationship</div>
                    <div className="text-xs text-emerald-700 font-medium mt-0.5">
                      Verified link within case search context
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-surface-300">
                  Click any graph node to inspect detailed evidence attributes.
                </div>
              )}
            </div>

            <div className="text-[11px] text-surface-300 border-t border-surface-700 pt-3 mt-4">
              Relationships indicate potential multi-source correlations.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
