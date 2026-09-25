import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { operationsService, OperationsSummary } from '../services/operationsService';
import { SystemStatusPanel } from '../components/operations/SystemStatusPanel';
import { ActiveSearchCard } from '../components/operations/ActiveSearchCard';
import { ReviewQueue } from '../components/operations/ReviewQueue';
import { SearchProgressModal } from '../components/operations/SearchProgressModal';
import { 
  Activity, Layers, Search, ShieldAlert, AlertTriangle, CheckCircle2, 
  Clock, ArrowRight, RefreshCw, Eye, Camera, FileText 
} from 'lucide-react';

export const OperationsCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Search Progress Modal State
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const fetchSummary = () => {
    setLoading(true);
    operationsService.getSummary()
      .then((data) => setSummary(data))
      .catch((err) => console.error('Error fetching operations summary:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000); // 5s polling for active searches
    return () => clearInterval(interval);
  }, []);

  const handleCancelSearch = async (sessionId: string) => {
    try {
      await operationsService.cancelSession(sessionId);
      fetchSummary();
    } catch (err) {
      console.error('Error cancelling search:', err);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Investigation Operations Center"
        subtitle="Real-time operational command console for search orchestration, processing pipeline status, review queue management, and system health."
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchSummary}
          >
            Refresh Operations
          </Button>
        }
      />

      {/* 1. SYSTEM HEALTH STATUS PANEL */}
      <div className="mb-6">
        <SystemStatusPanel />
      </div>

      {/* 2. OPERATIONAL COUNTERS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 text-xs">
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Active Searches</span>
          <span className="text-2xl font-extrabold text-brand-700 font-mono">{summary?.active_searches_count || 0}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono">{summary?.recently_completed_count || 0}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Partially Completed</span>
          <span className="text-2xl font-extrabold text-amber-700 font-mono">{summary?.partial_searches_count || 0}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Failed Processing</span>
          <span className="text-2xl font-extrabold text-rose-700 font-mono">{summary?.failed_searches_count || 0}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Requires Review</span>
          <span className="text-2xl font-extrabold text-sky-700 font-mono">{summary?.pending_reviews_count || 0}</span>
        </div>
        <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-surface-700 font-extrabold uppercase tracking-wider block">Open Tasks</span>
          <span className="text-2xl font-extrabold text-purple-700 font-mono">{summary?.open_tasks_count || 0}</span>
        </div>
      </div>

      {/* 3. ACTIVE SEARCHES GRID */}
      <div className="mb-6 space-y-4">
        <SectionHeader
          title="Active Search Orchestration"
          subtitle="Real-time multi-camera and record search sessions currently processing"
        />

        {loading && !summary ? (
          <div className="py-8 text-center text-surface-700 text-xs font-medium">Loading active search sessions...</div>
        ) : !summary?.active_searches || summary.active_searches.length === 0 ? (
          <div className="p-6 bg-surface-50 border border-surface-400 rounded-xl text-center text-xs text-surface-700 font-medium shadow-xs">
            No active search sessions processing at this moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.active_searches.map((session) => (
              <ActiveSearchCard
                key={session.id}
                session={session}
                onViewStages={(id) => setSelectedSessionId(id)}
                onCancelSearch={(id) => handleCancelSearch(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. UNIFIED REVIEW QUEUE */}
      <div className="mb-6">
        <ReviewQueue />
      </div>

      {/* 5. RECENT EVIDENCE FEED */}
      <Card className="mb-6">
        <SectionHeader
          title="Newly Generated Investigation Evidence"
          subtitle="Recent candidate groups and record matches generated by background AI search sessions"
        />

        {summary?.recent_evidence && summary.recent_evidence.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {summary.recent_evidence.map((ev) => (
              <div
                key={ev.id}
                onClick={() => navigate(`/candidates/${ev.id}`)}
                className="p-4 bg-surface-50 border border-surface-400 hover:border-brand-500 rounded-xl cursor-pointer transition-all space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-extrabold text-brand-700">{ev.cases?.case_id || 'MP-CASE'}</span>
                  <span className="font-extrabold text-brand-700 font-mono">{ev.overall_score}/100</span>
                </div>
                <div className="text-sm font-extrabold text-surface-950 truncate">Candidate Group #{ev.id.substring(0, 8)}</div>
                <div className="flex items-center justify-between text-xs text-surface-700 font-medium">
                  <span>{ev.camera_count || 1} Camera Feed(s)</span>
                  <span className="flex items-center gap-1 text-brand-700 font-bold">
                    Inspect <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-surface-700 font-medium">No recent evidence items recorded.</div>
        )}
      </Card>

      {/* Search Progress Modal */}
      {selectedSessionId && (
        <SearchProgressModal
          sessionId={selectedSessionId}
          isOpen={!!selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </PageContainer>
  );
};
