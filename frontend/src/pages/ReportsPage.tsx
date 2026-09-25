import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Download, Filter, Plus, Eye, CheckCircle2, 
  AlertCircle, ShieldAlert, Sparkles, RefreshCw 
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FilterBar } from '../components/ui/FilterBar';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { reportService, InvestigationReportItem } from '../services/reportService';
import { caseService } from '../services/caseService';
import type { MissingPersonCase } from '../types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<InvestigationReportItem[]>([]);
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCaseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const caseRes = await caseService.getCases();
      setCases(caseRes.items || []);

      const reportList = await reportService.getAllReports(selectedCaseId !== 'ALL' ? selectedCaseId : undefined);
      setReports(reportList);
    } catch (err) {
      console.warn('Reports load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (caseIdToGenerate?: string) => {
    const targetCaseId = caseIdToGenerate || (selectedCaseId !== 'ALL' ? selectedCaseId : cases[0]?.id);
    if (!targetCaseId) {
      setStatusMsg({ type: 'error', text: 'Please select a missing person case first.' });
      return;
    }

    setIsGenerating(true);
    setStatusMsg(null);

    try {
      const newReport = await reportService.generateReport(targetCaseId);
      setStatusMsg({ type: 'success', text: `Investigation report ${newReport.report_id || 'PDF'} generated successfully.` });
      await loadData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to generate investigation report.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (report: InvestigationReportItem) => {
    setDownloadingId(report.id || report.report_id);
    try {
      const blob = await reportService.downloadReport(report.report_id || report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.report_id || 'Investigation_Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      // Direct API fallback
      const fallbackUrl = `http://localhost:8000/api/reports/${report.report_id || report.id}/download`;
      window.open(fallbackUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (selectedCaseId !== 'ALL' && r.case_id !== selectedCaseId) return false;
    if (dateFilter && r.generated_at && !r.generated_at.startsWith(dateFilter)) return false;
    return true;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Investigation Reports"
        subtitle="Export official multi-page PDF investigation dossiers, multi-camera timelines, and human-verified evidence summaries."
        action={
          <Button
            variant="primary"
            size="sm"
            isLoading={isGenerating}
            onClick={() => handleGenerateReport()}
            icon={<Plus className="w-4 h-4" />}
          >
            Generate Case Report
          </Button>
        }
      />

      {/* Compliance Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-900 mb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
          <span>
            <strong className="font-bold text-amber-950">Official Audit Dossiers:</strong> All generated reports include verifiable chain of custody, camera sightings, institutional record scores, and mandatory human review disclaimers.
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadData}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold mb-6 shadow-xs border ${
          statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <FilterBar onReset={() => { setSelectedCaseId('ALL'); setDateFilter(''); }}>
        <div className="w-64">
          <Select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Cases' },
              ...cases.map((c) => ({ value: c.id, label: `${c.case_id || 'MP'} - ${c.reference_name || c.full_name}` }))
            ]}
          />
        </div>
        <div className="w-48">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </FilterBar>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-surface-800 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            Loading generated reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            title="No reports generated yet"
            description="Generate an official multi-page PDF investigation report for any case to compile multi-camera evidence and record logs."
            icon={FileText}
            actionLabel="Generate Report Now"
            onAction={() => handleGenerateReport()}
          />
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const matchedCase = cases.find((c) => c.id === report.case_id);
              const isDownloading = downloadingId === (report.id || report.report_id);

              return (
                <div
                  key={report.id}
                  className="p-5 bg-surface-50 border border-surface-400 hover:border-brand-500 rounded-2xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-surface-200 border border-surface-300 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-brand-600" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-extrabold text-surface-950 font-mono">
                          {report.report_id || 'RPT-OFFICIAL'}
                        </span>
                        <Badge variant="success">Version {report.report_version || 1}</Badge>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border bg-emerald-100 text-emerald-900 border-emerald-300 uppercase">
                          {report.status || 'COMPLETED'}
                        </span>
                      </div>

                      <p className="text-xs text-surface-800 font-medium mb-1">
                        Case: <strong className="text-surface-950">{matchedCase ? `${matchedCase.case_id || 'MP'} - ${matchedCase.reference_name || matchedCase.full_name}` : report.case_id}</strong>
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-surface-700 font-medium">
                        <span>Generated: {report.generated_at ? new Date(report.generated_at).toLocaleString() : 'Recent'}</span>
                        <span>Format: Official PDF</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-surface-300">
                    <Link to={`/investigations/${report.case_id}/workspace`}>
                      <Button size="sm" variant="secondary" icon={<Eye className="w-3.5 h-3.5" />}>
                        Workspace
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={isDownloading}
                      onClick={() => handleDownloadPDF(report)}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
