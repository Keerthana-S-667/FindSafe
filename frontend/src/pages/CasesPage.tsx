import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Eye, Archive } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { FilterBar } from '../components/ui/FilterBar';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { caseService, CaseListResponse } from '../services/caseService';
import { MissingPersonCase } from '../types';
import { formatDate } from '../utils/formatters';

export const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [caseList, setCaseList] = useState<MissingPersonCase[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Archive Dialog State
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  async function loadCases() {
    setIsLoading(true);
    try {
      const data: CaseListResponse = await caseService.getCases({
        search: searchTerm,
        status: statusFilter,
        page: currentPage,
        pageSize: pageSize,
      });
      setCaseList(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.warn('Failed to load cases from backend:', err);
      setCaseList([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, [searchTerm, statusFilter, currentPage]);

  const handleArchiveConfirm = async () => {
    if (!archiveTargetId) return;
    setIsArchiving(true);
    try {
      await caseService.archiveCase(archiveTargetId);
      setArchiveTargetId(null);
      await loadCases();
    } catch (err) {
      console.error('Failed to archive case:', err);
    } finally {
      setIsArchiving(false);
    }
  };

  const columns: Column<MissingPersonCase>[] = [
    {
      key: 'case_number',
      header: 'Case ID',
      render: (row) => (
        <span className="font-mono text-xs font-extrabold text-brand-700">
          {row.case_id || row.case_number}
        </span>
      ),
    },
    {
      key: 'reference_name',
      header: 'Subject Reference',
      render: (row) => (
        <div>
          <div className="font-extrabold text-surface-950">{row.reference_name || row.full_name}</div>
          {row.age_range && <div className="text-[10px] text-surface-700 font-medium">Age: {row.age_range}</div>}
        </div>
      ),
    },
    {
      key: 'last_seen_location',
      header: 'Last Known Location',
      render: (row) => <span className="text-surface-900 font-medium">{row.last_seen_location}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => (
        <span className="text-surface-700 font-mono text-[11px] font-bold">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/cases/${row.id}`)}
          >
            View
          </Button>
          {row.status !== 'archived' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-700 hover:text-red-900"
              icon={<Archive className="w-3.5 h-3.5" />}
              onClick={() => setArchiveTargetId(row.id)}
            >
              Archive
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <PageContainer>
      <PageHeader
        title="Cases"
        subtitle="Manage authorized missing-person investigation files and reference records."
        action={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/cases/new')}>
            Create Case
          </Button>
        }
      />

      <FilterBar onReset={handleResetFilters}>
        <div className="w-full sm:w-64">
          <SearchInput
            placeholder="Search by name or case ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </div>
      </FilterBar>

      <Card>
        {caseList.length === 0 && !isLoading ? (
          <EmptyState
            title="No missing-person cases"
            description="Create a case to begin an investigation."
            actionLabel="Create Case"
            onAction={() => navigate('/cases/new')}
            icon={FolderKanban}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={caseList}
              keyExtractor={(row) => row.id}
              isLoading={isLoading}
              emptyText="No missing-person cases match your search criteria."
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </Card>

      {/* Confirmation Dialog for Archiving Case */}
      <ConfirmDialog
        isOpen={Boolean(archiveTargetId)}
        onClose={() => setArchiveTargetId(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Case File"
        message="Are you sure you want to archive this missing-person case file? The case status will be set to Archived."
        confirmText="Archive Case"
        variant="danger"
        isLoading={isArchiving}
      />
    </PageContainer>
  );
};
