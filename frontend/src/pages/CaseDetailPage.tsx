import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderKanban,
  Image as ImageIcon,
  Search,
  UserCheck,
  MapPin,
  Clock,
  Edit,
  Archive,
  Play,
  Shirt,
  Tag,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonCard } from '../components/common/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { caseService } from '../services/caseService';
import { searchService } from '../services/searchService';
import { MissingPersonCase, SearchSession } from '../types';
import { formatDate } from '../utils/formatters';

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<MissingPersonCase | null>(null);
  const [caseSessions, setCaseSessions] = useState<SearchSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Archive Dialog State
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  async function loadCaseDetail() {
    if (!caseId) return;
    setIsLoading(true);
    try {
      const data = await caseService.getCaseById(caseId);
      setCaseData(data);
      if (data) {
        setEditName(data.reference_name || data.full_name || '');
        setEditStatus(data.status || 'active');
        setEditLocation(data.last_seen_location || '');
        setEditNotes(data.notes || '');

        // Fetch search sessions for this case
        try {
          const sessions = await searchService.getSearchSessions(data.id || caseId);
          setCaseSessions(sessions);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Error fetching case detail:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCaseDetail();
  }, [caseId]);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !caseId) return;
    setIsSaving(true);
    try {
      const updated = await caseService.updateCase(caseData.id || caseId, {
        reference_name: editName,
        status: editStatus as any,
        last_seen_location: editLocation,
        notes: editNotes,
      });
      setCaseData(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update case:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!caseData || !caseId) return;
    setIsArchiving(true);
    try {
      await caseService.archiveCase(caseData.id || caseId);
      setIsArchiveDialogOpen(false);
      await loadCaseDetail();
    } catch (err) {
      console.error('Failed to archive case:', err);
    } finally {
      setIsArchiving(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'photos', label: 'Reference Photos', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'searches', label: `Search History (${caseSessions.length})`, icon: <Search className="w-4 h-4" /> },
    { id: 'candidates', label: 'Candidates', icon: <UserCheck className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonCard />
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!caseData) {
    return (
      <PageContainer>
        <Card>
          <EmptyState
            title="Case Record Not Found"
            description="The requested missing person case file could not be found or has been removed."
            actionLabel="Return to Cases"
            onAction={() => navigate('/cases')}
            icon={AlertCircle}
          />
        </Card>
      </PageContainer>
    );
  }

  const subjectName = caseData.reference_name || caseData.full_name || 'Subject Reference';
  const displayCaseId = caseData.case_id || caseData.case_number || caseId;

  return (
    <PageContainer>
      <PageHeader
        title={`Case Record #${displayCaseId}`}
        subtitle={`Subject: ${subjectName}`}
        breadcrumbs={[
          { label: 'Cases', path: '/cases' },
          { label: `Case #${displayCaseId}` },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<FolderKanban className="w-4 h-4" />}
              onClick={() => navigate(`/cases/${caseData.id || caseId}/investigation`)}
            >
              Investigation Workspace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/cases')}
            >
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Case
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-4 h-4" />}
              onClick={() => navigate(`/search/crowd?case_id=${caseData.id}`)}
            >
              Start Search
            </Button>
          </div>
        }
      />


      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Case Info Card */}
          <Card className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-surface-700/60 pb-3">
              <h3 className="text-sm font-semibold text-surface-50">Subject Information</h3>
              <StatusBadge status={caseData.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-surface-200/50 block mb-0.5">Subject Full Name</span>
                <span className="text-surface-50 font-semibold text-sm">{subjectName}</span>
              </div>
              <div>
                <span className="text-surface-200/50 block mb-0.5">Case Identifier</span>
                <span className="font-mono text-brand-400 font-semibold">{displayCaseId}</span>
              </div>
              <div>
                <span className="text-surface-200/50 block mb-0.5">Age Range</span>
                <span className="text-surface-50">{caseData.age_range || caseData.age || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-surface-200/50 block mb-0.5">Search Radius</span>
                <span className="text-surface-50">{caseData.search_radius_km || 5} km</span>
              </div>
              <div>
                <span className="text-surface-200/50 block mb-0.5">Upper Clothing</span>
                <span className="text-surface-50">{caseData.upper_clothing || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-surface-200/50 block mb-0.5">Lower Clothing</span>
                <span className="text-surface-50">{caseData.lower_clothing || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-surface-200/50 block mb-0.5">Bag / Accessories</span>
                <span className="text-surface-50">
                  {[caseData.bag, caseData.accessories].filter(Boolean).join(', ') || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-surface-200/50 block mb-0.5">Date Created</span>
                <span className="text-surface-200/80 font-mono">{formatDate(caseData.created_at)}</span>
              </div>
            </div>

            {caseData.notes && (
              <div className="pt-3 border-t border-surface-300">
                <span className="text-xs font-bold text-surface-950 block mb-1">Notes & Context</span>
                <p className="text-xs text-surface-950 font-medium leading-relaxed bg-surface-200 p-3 rounded-lg border border-surface-300">
                  {caseData.notes}
                </p>
              </div>
            )}
          </Card>

          {/* Right Column: Reference Image & Location Summary */}
          <div className="space-y-6">
            {/* Reference Image Container */}
            <Card>
              <h3 className="text-sm font-extrabold text-surface-950 border-b border-surface-300 pb-3 mb-4">
                Reference Photograph
              </h3>
              {caseData.reference_image_url ? (
                <div className="rounded-xl overflow-hidden border border-surface-300 bg-surface-200">
                  <img
                    src={caseData.reference_image_url}
                    alt={subjectName}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="p-3 text-[11px] font-mono text-surface-800 font-medium border-t border-surface-300">
                    Path: {caseData.reference_image_path || 'Storage Bucket'}
                  </div>
                </div>
              ) : (
                <div className="h-48 rounded-xl bg-surface-200 border border-surface-300 flex flex-col items-center justify-center p-4 text-center">
                  <ImageIcon className="w-8 h-8 text-surface-700 mb-2" />
                  <span className="text-xs text-surface-800 font-bold">No reference image attached</span>
                </div>
              )}
            </Card>

            {/* Location & Actions */}
            <Card>
              <h3 className="text-sm font-extrabold text-surface-950 border-b border-surface-300 pb-3 mb-3">
                Location & Timestamp
              </h3>
              <div className="text-xs space-y-3">
                <div className="flex items-start gap-2.5 text-surface-950 font-medium">
                  <MapPin className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-surface-950">Last Known Location</span>
                    <span>{caseData.last_seen_location}</span>
                  </div>
                </div>
                {caseData.last_seen_timestamp && (
                  <div className="flex items-start gap-2.5 text-surface-950 font-medium">
                    <Clock className="w-4 h-4 text-surface-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-surface-950">Last Seen Date & Time</span>
                      <span className="font-mono text-[11px] font-bold">{formatDate(caseData.last_seen_timestamp)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-surface-300 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700 hover:text-red-900 font-bold"
                  icon={<Archive className="w-3.5 h-3.5" />}
                  onClick={() => setIsArchiveDialogOpen(true)}
                >
                  Archive Case
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <Card>
          <EmptyState
            title="Reference Photo Bucket"
            description="Reference photographs are securely uploaded and stored in Supabase Storage."
            icon={ImageIcon}
          />
        </Card>
      )}

      {activeTab === 'searches' && (
        <Card>
          <div className="flex items-center justify-between border-b border-surface-300 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-surface-950">CCTV Video Search Sessions</h3>
              <p className="text-xs text-surface-800 font-medium">Recorded search sessions and processed video frames for this case</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={<Play className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/search/crowd?case_id=${caseData.id}`)}
            >
              Search The Crowd
            </Button>
          </div>

          {caseSessions.length === 0 ? (
            <EmptyState
              title="No search sessions logged"
              description="Video and CCTV search sessions for this case will appear here."
              actionLabel="Search The Crowd"
              onAction={() => navigate(`/search/crowd?case_id=${caseData.id}`)}
              icon={Search}
            />
          ) : (
            <div className="space-y-3">
              {caseSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/search/crowd/${session.id}`)}
                  className="p-4 bg-surface-50 border border-surface-400 hover:border-brand-500 rounded-xl cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-surface-950 group-hover:text-brand-700 transition-colors">
                        {session.video_filename || 'CCTV Video Search'}
                      </span>
                      <span className="text-[11px] font-mono text-surface-800 font-bold">ID: {session.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-[11px] text-surface-800 font-medium flex flex-wrap items-center gap-3">
                      <span>FPS: <strong className="text-surface-950 font-bold">{session.video_fps || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Duration: <strong className="text-surface-950 font-bold">{session.video_duration_seconds ? `${session.video_duration_seconds}s` : 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Sampled Frames: <strong className="text-brand-700 font-bold">{session.sampled_frames || 0}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <StatusBadge status={session.status} />
                      <span className="block text-[10px] text-surface-800 font-medium mt-1">{formatDate(session.created_at)}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="group-hover:text-brand-700 font-bold">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}


      {activeTab === 'candidates' && (
        <Card>
          <EmptyState
            title="No match candidates detected"
            description="Candidates generated by visual re-ID will appear here for review."
            icon={UserCheck}
          />
        </Card>
      )}

      {/* Edit Case Modal Dialog */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Case Record">
        <form onSubmit={handleEditSave} className="space-y-4">
          <Input
            label="Subject Reference / Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Select
            label="Case Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
          <Input
            label="Last Known Location"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            required
          />
          <Textarea
            label="Notes"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Archiving */}
      <ConfirmDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        onConfirm={handleArchiveConfirm}
        title="Archive Case File"
        message="Are you sure you want to archive this case? The status will be set to Archived."
        confirmText="Archive Case"
        variant="danger"
        isLoading={isArchiving}
      />
    </PageContainer>
  );
};
