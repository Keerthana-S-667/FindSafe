import React, { useState, useEffect } from 'react';
import { operationsService, SystemStatusData } from '../../services/operationsService';
import { Activity, Server, Database, HardDrive, Cpu, RefreshCw } from 'lucide-react';

export const SystemStatusPanel: React.FC = () => {
  const [health, setHealth] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    operationsService.getSystemStatus()
      .then((data) => setHealth(data))
      .catch((err) => console.error('Error fetching system health:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Operational':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Operational</span>;
      case 'Degraded':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Degraded</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Unavailable</span>;
    }
  };

  return (
    <div className="bg-surface-50 border border-surface-400 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-surface-300 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-600" />
          <h3 className="text-base font-extrabold text-surface-950">System Operations Status</h3>
        </div>
        <button
          onClick={fetchHealth}
          className="p-1.5 rounded-lg bg-surface-200 border border-surface-300 text-surface-800 hover:text-surface-950"
          title="Refresh Health Status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Backend API */}
        <div className="p-3 bg-surface-200 border border-surface-300 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-surface-950 flex items-center gap-1.5 font-bold">
              <Server className="w-3.5 h-3.5 text-sky-800" /> Backend API
            </span>
            {getStatusBadge(health?.subsystems?.backend_api?.status || 'Operational')}
          </div>
          <p className="text-[11px] text-surface-700 font-medium pt-1 truncate">{health?.subsystems?.backend_api?.detail || 'FastAPI Engine'}</p>
        </div>

        {/* Database */}
        <div className="p-3 bg-surface-200 border border-surface-300 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-surface-950 flex items-center gap-1.5 font-bold">
              <Database className="w-3.5 h-3.5 text-emerald-800" /> Database
            </span>
            {getStatusBadge(health?.subsystems?.database?.status || 'Operational')}
          </div>
          <p className="text-[11px] text-surface-700 font-medium pt-1 truncate">{health?.subsystems?.database?.detail || 'PostgreSQL DB'}</p>
        </div>

        {/* Storage */}
        <div className="p-3 bg-surface-200 border border-surface-300 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-surface-950 flex items-center gap-1.5 font-bold">
              <HardDrive className="w-3.5 h-3.5 text-indigo-800" /> Storage Buckets
            </span>
            {getStatusBadge(health?.subsystems?.storage?.status || 'Operational')}
          </div>
          <p className="text-[11px] text-surface-700 font-medium pt-1 truncate">{health?.subsystems?.storage?.detail || 'Supabase Storage'}</p>
        </div>

        {/* AI Engine */}
        <div className="p-3 bg-surface-200 border border-surface-300 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-surface-950 flex items-center gap-1.5 font-bold">
              <Cpu className="w-3.5 h-3.5 text-brand-700" /> AI Processing
            </span>
            {getStatusBadge(health?.subsystems?.ai_engine?.status || 'Operational')}
          </div>
          <p className="text-[11px] text-surface-700 font-medium pt-1 truncate">{health?.subsystems?.ai_engine?.detail || 'YOLOv8 + Re-ID'}</p>
        </div>
      </div>
    </div>
  );
};
