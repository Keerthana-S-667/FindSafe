import React, { useState, useEffect } from 'react';
import { 
  FileSearch, Search, Database, Upload, AlertCircle, CheckCircle, 
  XCircle, Filter, ChevronRight, Eye, RefreshCw, X, ShieldAlert, FileText, Check, Ban
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';
import { caseService } from '../services/caseService';
import { recordService } from '../services/recordService';
import type { MissingPersonCase, RecordMatch, FoundPersonRecord, CSVImportResult } from '../types';

export const SearchRecordsPage: React.FC = () => {
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<MissingPersonCase | null>(null);

  // Source filtering
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [timeWindow, setTimeWindow] = useState<number>(72);
  const [locationSearch, setLocationSearch] = useState<string>('');

  // Execution state
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [recordMatches, setRecordMatches] = useState<RecordMatch[]>([]);
  const [searchedCount, setSearchedCount] = useState<number>(0);

  // CSV Import State
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Detail Modal State
  const [activeMatch, setActiveMatch] = useState<RecordMatch | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadMatchesForCase = async (caseId: string) => {
    if (!caseId) return;
    setIsLoadingMatches(true);
    try {
      const matches = await recordService.getRecordMatches(caseId);
      setRecordMatches(matches || []);
      setSearchedCount(matches?.length || 0);
    } catch (err) {
      console.warn('Could not prefetch record matches:', err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const loadCases = async () => {
    try {
      const res = await caseService.getCases();
      const list = res?.items || [];
      setCases(list);
      if (list.length > 0) {
        setSelectedCaseId(list[0].id);
        setSelectedCase(list[0]);
        loadMatchesForCase(list[0].id);
      }
    } catch (err: any) {
      setErrorMsg('Failed to load missing person cases.');
    }
  };

  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(caseId);
    const found = cases.find((c) => c.id === caseId || c.case_id === caseId);
    setSelectedCase(found || null);
    if (caseId) {
      loadMatchesForCase(caseId);
    }
  };

  const handleExecuteSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      setErrorMsg('Please select a missing person case.');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const sourceList = sourceTypeFilter === 'all' ? ['all'] : [sourceTypeFilter];
      const res = await recordService.executeRecordSearch({
        case_id: selectedCaseId,
        source_types: sourceList,
        search_radius_km: Number(searchRadius),
        time_window_hours: Number(timeWindow),
      });

      setRecordMatches(res.matches || []);
      setSearchedCount(res.total_records_searched || 0);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to execute record search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setErrorMsg(null);

    try {
      const res = await recordService.importCSVRecords(file);
      setImportResult(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to import CSV file.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReviewMatch = async (status: 'potential_match' | 'rejected' | 'under_review') => {
    if (!activeMatch) return;
    setIsReviewing(true);
    try {
      const updated = await recordService.reviewRecordMatch(activeMatch.id, status, reviewNote);
      setRecordMatches((prev) => prev.map((m) => (m.id === activeMatch.id ? { ...m, match_status: status } : m)));
      setActiveMatch((prev) => (prev ? { ...prev, match_status: status } : null));
    } catch (err: any) {
      setErrorMsg('Failed to update match status.');
    } finally {
      setIsReviewing(false);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'police':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'hospital':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'shelter':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'public_report':
        return 'bg-violet-100 text-violet-900 border-violet-300';
      default:
        return 'bg-surface-200 text-surface-950 border-surface-400';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Search Records"
        subtitle="AI-Assisted Missing-Person Information Matching across Police, Hospital, Shelter, and Public Reports."
      />

      {/* Mandatory Compliance Banner */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-900 mb-6">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-950">Mandatory Human Verification Notice:</strong> Search outputs represent <em>Potential Record Matches</em> based on evidence scores. AI never confirms final identity.
          </span>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowImportModal(true)} icon={<Upload className="w-3.5 h-3.5" />}>
          Import Demo CSV
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-xs text-red-900 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Configuration Form */}
      <Card className="mb-6">
        <form onSubmit={handleExecuteSearch} className="space-y-6">
          <SectionHeader
            title="Search Case & Record Parameters"
            subtitle="Configure source types, spatial radius, and temporal search scope"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Select Missing Person Case File"
              required
              value={selectedCaseId}
              onChange={(e) => handleCaseChange(e.target.value)}
              options={
                cases.length > 0
                  ? cases.map((c) => ({
                      value: c.id,
                      label: `${c.case_id || 'MP'} - ${c.reference_name || c.full_name} (${c.last_seen_location || 'Unknown'})`,
                    }))
                  : [{ value: '', label: 'Loading cases...' }]
              }
            />

            <div>
              <label className="block text-xs font-bold text-surface-950 mb-2">Record Sources</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Sources' },
                  { id: 'police', label: 'Police' },
                  { id: 'hospital', label: 'Hospital' },
                  { id: 'shelter', label: 'Shelter' },
                  { id: 'public_report', label: 'Public Report' },
                ].map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setSourceTypeFilter(src.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      sourceTypeFilter === src.id
                        ? 'bg-brand-500/20 text-brand-900 border-brand-500 shadow-xs'
                        : 'bg-surface-50 text-surface-950 border-surface-400 hover:bg-surface-200'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Context Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-surface-50 border border-surface-400 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-surface-950 mb-1">Search Radius</label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full bg-surface-200 border border-surface-300 text-surface-950 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-bold"
              >
                <option value={5}>5 km radius</option>
                <option value={10}>10 km radius</option>
                <option value={25}>25 km radius</option>
                <option value={50}>50 km radius</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-950 mb-1">Time Window</label>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(Number(e.target.value))}
                className="w-full bg-surface-200 border border-surface-300 text-surface-950 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-bold"
              >
                <option value={6}>Within 6 hours</option>
                <option value={24}>Within 24 hours</option>
                <option value={72}>Within 72 hours</option>
                <option value={168}>Within 7 days</option>
              </select>
            </div>

            <Input
              label="Location Context"
              placeholder="Filter district or hospital..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-surface-800">
              {searchedCount > 0 ? `Evaluated ${searchedCount} institutional records` : 'Ready to search database records.'}
            </span>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSearching}
              icon={<Search className="w-4 h-4" />}
            >
              Search Records
            </Button>
          </div>
        </form>
      </Card>

      {/* Results Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            title="Potential Record Matches"
            subtitle="Categorized evidence scoring across available police, hospital, shelter, and public records"
          />
          {recordMatches.length > 0 && (
            <span className="text-xs text-surface-950 font-bold bg-surface-200 px-3 py-1 rounded-lg border border-surface-400">
              {recordMatches.length} Potential Matches
            </span>
          )}
        </div>

        {recordMatches.length === 0 ? (
          <EmptyState
            title="No potential record matches found"
            description="Select a case and execute 'Search Records' to analyze institutional database records."
            icon={FileSearch}
            actionLabel="Import Demo Records"
            onAction={() => setShowImportModal(true)}
          />
        ) : (
          <div className="space-y-4">
            {recordMatches.map((match) => {
              const rec = (match.found_person_records || {}) as FoundPersonRecord;
              const srcType = rec.source_type || 'public_report';
              const hasImg = Boolean(rec.reference_image_url || rec.reference_image_path);
              const score = match.overall_score || 0;

              return (
                <div
                  key={match.id}
                  className="p-4 bg-surface-50 border border-surface-400 hover:border-brand-500 rounded-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    {/* Record Image or Icon */}
                    <div className="w-16 h-16 bg-surface-200 rounded-lg border border-surface-300 overflow-hidden shrink-0 flex items-center justify-center text-surface-800 text-xs">
                      {hasImg ? (
                        <img
                          src={rec.reference_image_url}
                          alt={rec.record_id}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-1">
                          <FileText className="w-6 h-6 mx-auto mb-1 text-surface-700" />
                          <span className="text-[10px] text-surface-800 font-bold block">No Image</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-extrabold text-surface-950">{rec.record_id || 'REC-UNK'}</span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getSourceBadgeColor(srcType)}`}>
                          {srcType.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          match.match_status === 'potential_match' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          match.match_status === 'rejected' ? 'bg-red-100 text-red-900 border-red-300' :
                          'bg-surface-200 text-surface-950 border-surface-400'
                        }`}>
                          {match.match_status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-surface-800 font-medium mb-1.5">
                        {rec.reference_name || rec.location || 'Institutional Record Sighting'}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-surface-800 font-medium flex-wrap">
                        <span>Clothing: {rec.upper_clothing || 'Unknown'} / {rec.lower_clothing || 'Unknown'}</span>
                        <span>Distance: {match.evidence_details?.distance_meters ? `${(match.evidence_details.distance_meters/1000).toFixed(1)} km` : 'Contextual'}</span>
                        <span>Time Diff: {match.evidence_details?.time_diff_hours ? `${match.evidence_details.time_diff_hours} hrs` : 'Within window'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Review Action */}
                  <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-surface-300">
                    <div className="text-right">
                      <span className="text-xs text-surface-800 font-bold block mb-0.5">Evidence Score</span>
                      <span className="text-lg font-extrabold text-brand-700 font-mono">
                        {score.toFixed(1)} <span className="text-xs text-surface-700 font-normal">/ 100</span>
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setActiveMatch(match);
                        setReviewNote('');
                      }}
                      icon={<Eye className="w-4 h-4" />}
                    >
                      Compare & Review
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-amber-950/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-50 border border-surface-400 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-surface-300">
              <h3 className="text-base font-extrabold text-surface-950 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-600" />
                Import Demonstration CSV Records
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-surface-700 hover:text-surface-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-surface-800 font-medium">
              Upload a synthetic CSV record dataset containing Police, Hospital, Shelter, or Public Report records for hackathon demonstration.
            </p>

            <div className="border-2 border-dashed border-surface-400 hover:border-brand-500 rounded-xl p-6 text-center transition-all bg-surface-200/50">
              <Upload className="w-8 h-8 text-surface-700 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-xs font-bold text-brand-700 hover:underline">Choose CSV File</span>
                <input type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" />
              </label>
              <p className="text-[11px] text-surface-700 mt-1 font-medium">Expected columns: record_id, source_type, reference_name, upper_clothing, lower_clothing, location, latitude, longitude, record_timestamp</p>
            </div>

            {importResult && (
              <div className="p-4 bg-surface-200 border border-surface-300 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-bold text-surface-950">
                  <span>Total Found: {importResult.total_found}</span>
                  <span className="text-emerald-700">Valid: {importResult.valid_count}</span>
                  <span className="text-red-700">Invalid: {importResult.invalid_count}</span>
                </div>
                <p className="text-surface-800 font-medium">Successfully inserted {importResult.inserted_count} records into Supabase database.</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-300">
              <Button variant="secondary" onClick={() => setShowImportModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Record Match Detail & Review Modal */}
      {activeMatch && (
        <div className="fixed inset-0 z-50 bg-amber-950/30 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-50 border border-surface-400 rounded-2xl max-w-5xl w-full p-6 space-y-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-300">
              <div>
                <span className="text-xs text-brand-700 font-bold block uppercase tracking-wider">Potential Record Match Review</span>
                <h2 className="text-lg font-extrabold text-surface-950 flex items-center gap-2">
                  Match Evidence Score: {activeMatch.overall_score.toFixed(1)} / 100
                </h2>
              </div>
              <button onClick={() => setActiveMatch(null)} className="text-surface-700 hover:text-surface-950 font-bold">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Side-by-Side Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Missing Person Case */}
              <div className="p-4 bg-surface-200 border border-surface-300 rounded-xl space-y-3">
                <span className="text-xs font-extrabold text-surface-950 uppercase tracking-wider block">Reference Missing Person</span>
                <div className="h-44 bg-surface-50 rounded-lg overflow-hidden flex items-center justify-center border border-surface-300">
                  {selectedCase?.reference_image_url ? (
                    <img src={selectedCase.reference_image_url} alt="Reference" className="h-full object-cover" />
                  ) : (
                    <span className="text-xs text-surface-700 font-medium">No Reference Image</span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-surface-950 font-medium">
                  <p><strong className="text-surface-700 font-bold">Name:</strong> {selectedCase?.reference_name || selectedCase?.full_name}</p>
                  <p><strong className="text-surface-700 font-bold">Upper Clothing:</strong> {selectedCase?.upper_clothing || 'Unknown'}</p>
                  <p><strong className="text-surface-700 font-bold">Lower Clothing:</strong> {selectedCase?.lower_clothing || 'Unknown'}</p>
                  <p><strong className="text-surface-700 font-bold">Last Seen Location:</strong> {selectedCase?.last_seen_location}</p>
                </div>
              </div>

              {/* Right: Potential Found Person Record */}
              <div className="p-4 bg-surface-200 border border-surface-300 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-surface-950 uppercase tracking-wider">Institutional Found Record</span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${getSourceBadgeColor(activeMatch.found_person_records?.source_type || '')}`}>
                    {activeMatch.found_person_records?.source_type}
                  </span>
                </div>

                <div className="h-44 bg-surface-50 rounded-lg overflow-hidden flex items-center justify-center border border-surface-300">
                  {activeMatch.found_person_records?.reference_image_url ? (
                    <img src={activeMatch.found_person_records.reference_image_url} alt="Record" className="h-full object-cover" />
                  ) : (
                    <div className="text-center p-2 text-surface-700">
                      <FileText className="w-8 h-8 mx-auto mb-1 text-surface-700" />
                      <span className="text-xs font-bold block text-surface-950">Image Unavailable</span>
                      <span className="text-[10px] text-surface-800 font-medium">Matched via attributes, location & time</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-surface-950 font-medium">
                  <p><strong className="text-surface-700 font-bold">Record ID:</strong> {activeMatch.found_person_records?.record_id}</p>
                  <p><strong className="text-surface-700 font-bold">Upper Clothing:</strong> {activeMatch.found_person_records?.upper_clothing || 'Unknown'}</p>
                  <p><strong className="text-surface-700 font-bold">Lower Clothing:</strong> {activeMatch.found_person_records?.lower_clothing || 'Unknown'}</p>
                  <p><strong className="text-surface-700 font-bold">Record Location:</strong> {activeMatch.found_person_records?.location || 'Unspecified'}</p>
                </div>
              </div>
            </div>

            {/* Evidence Comparison Table */}
            <div className="p-4 bg-surface-200 border border-surface-300 rounded-xl space-y-3">
              <h4 className="text-xs font-extrabold text-surface-950 uppercase tracking-wider">Structured Evidence Breakdown</h4>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-surface-300 text-surface-700 font-bold">
                    <th className="py-2">Evidence Feature</th>
                    <th className="py-2">Missing Person Case</th>
                    <th className="py-2">Found Record</th>
                    <th className="py-2">Match Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-300 text-surface-950 font-medium">
                  <tr>
                    <td className="py-2 font-bold">Upper Clothing</td>
                    <td className="py-2">{selectedCase?.upper_clothing || 'Unknown'}</td>
                    <td className="py-2">{activeMatch.found_person_records?.upper_clothing || 'Unknown'}</td>
                    <td className="py-2 text-emerald-700 font-bold">Attribute Evaluated</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold">Lower Clothing</td>
                    <td className="py-2">{selectedCase?.lower_clothing || 'Unknown'}</td>
                    <td className="py-2">{activeMatch.found_person_records?.lower_clothing || 'Unknown'}</td>
                    <td className="py-2 text-emerald-700 font-bold">Attribute Evaluated</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold">Spatial Distance</td>
                    <td className="py-2">{selectedCase?.last_seen_location}</td>
                    <td className="py-2">{activeMatch.found_person_records?.location}</td>
                    <td className="py-2 text-brand-700 font-bold">{activeMatch.evidence_details?.distance_meters ? `${(activeMatch.evidence_details.distance_meters/1000).toFixed(1)} km` : 'Proximity score evaluated'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold">Time Difference</td>
                    <td className="py-2">{selectedCase?.last_seen_timestamp ? new Date(selectedCase.last_seen_timestamp).toLocaleString() : 'Last seen'}</td>
                    <td className="py-2">{activeMatch.found_person_records?.record_timestamp ? new Date(activeMatch.found_person_records.record_timestamp).toLocaleString() : 'Record time'}</td>
                    <td className="py-2 text-amber-700 font-bold">{activeMatch.evidence_details?.time_diff_hours ? `${activeMatch.evidence_details.time_diff_hours} hrs` : 'Temporal consistency evaluated'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Review Notes & Actions */}
            <div className="space-y-4 pt-2">
              <Input
                label="Investigator Review Notes"
                placeholder="Add verification notes or cross-reference details..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />

              <div className="flex items-center justify-between pt-2 border-t border-surface-300">
                <span className="text-[11px] text-surface-800 font-bold">Current Status: <strong>{activeMatch.match_status?.toUpperCase()}</strong></span>
                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isReviewing}
                    onClick={() => handleReviewMatch('rejected')}
                    icon={<Ban className="w-4 h-4" />}
                  >
                    Reject Match
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isReviewing}
                    onClick={() => handleReviewMatch('potential_match')}
                    icon={<Check className="w-4 h-4" />}
                  >
                    Mark Potential Match
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
