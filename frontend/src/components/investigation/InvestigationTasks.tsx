import React, { useState, useEffect } from 'react';
import { intelligenceService, InvestigationTask } from '../../services/intelligenceService';
import { CheckSquare, Plus, CheckCircle, XCircle, Clock, User, AlertCircle } from 'lucide-react';

interface Props {
  caseId: string;
  candidateGroupId?: string;
}

export const InvestigationTasks: React.FC<Props> = ({ caseId, candidateGroupId }) => {
  const [tasks, setTasks] = useState<InvestigationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const fetchTasks = () => {
    if (!caseId) return;
    setLoading(true);
    intelligenceService.getCaseTasks(caseId, statusFilter)
      .then((data) => setTasks(data))
      .catch((err) => console.error('Error fetching tasks:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [caseId, statusFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await intelligenceService.createTask(caseId, {
        title: newTitle,
        description: newDescription,
        candidate_group_id: candidateGroupId,
        assigned_to: assignedTo || 'Investigator'
      });

      setNewTitle('');
      setNewDescription('');
      setAssignedTo('');
      setShowCreateModal(false);
      fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: 'completed' | 'cancelled') => {
    try {
      await intelligenceService.updateTaskStatus(taskId, status);
      fetchTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-bold text-surface-50">Follow-Up Investigation Tasks</h3>
          </div>
          <p className="text-xs text-surface-300 mt-0.5">
            Lightweight operational checklist for reviewing camera feeds, verifying shelter entries, and logging actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex bg-surface-950 p-1 rounded-lg border border-surface-700 text-xs font-medium">
            {['all', 'pending', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  statusFilter === st ? 'bg-surface-700 text-surface-50 font-bold' : 'text-surface-300 hover:text-surface-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-surface-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-8 text-center text-surface-300 text-xs">Loading follow-up tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center text-surface-300 text-xs">No follow-up tasks registered for this case.</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                task.status === 'completed'
                  ? 'bg-surface-950/60 border-surface-700 opacity-80'
                  : task.status === 'cancelled'
                  ? 'bg-rose-100 border-rose-300 opacity-60'
                  : 'bg-surface-950 border-surface-700 hover:border-brand-500'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-sm ${
                      task.status === 'completed' ? 'line-through text-surface-300' : 'text-surface-50'
                    }`}
                  >
                    {task.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : task.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs text-surface-300 max-w-xl">{task.description}</p>
                )}
                <div className="flex items-center gap-4 text-[11px] text-surface-300 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-surface-300" />
                    {task.assigned_to || 'Unassigned'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-surface-300" />
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {task.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(task.id, 'completed')}
                    className="px-2.5 py-1 rounded bg-emerald-100 border border-emerald-300 hover:bg-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(task.id, 'cancelled')}
                    className="px-2.5 py-1 rounded bg-surface-950 border border-surface-700 hover:bg-surface-700 text-surface-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/30 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-800 border border-surface-700 rounded-xl p-6 space-y-4 text-surface-50 shadow-2xl">
            <h4 className="text-lg font-bold text-surface-50">Create Investigation Task</h4>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify Shelter Entry Record REC-021"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Additional follow-up details for reviewer..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">Assigned Investigator / Reviewer</label>
                <input
                  type="text"
                  placeholder="Officer Email or Name"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-surface-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-950 border border-surface-700 text-xs font-medium text-surface-300 hover:text-surface-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-surface-950 shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
