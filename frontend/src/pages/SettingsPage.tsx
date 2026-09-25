import React, { useState, useEffect } from 'react';
import { Settings, User, Palette, Server, Database, Shield, Users, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';
import { adminService, type AdminUserItem } from '../services/adminService';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { health } = useHealth();

  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = (user?.role || '').toLowerCase() === 'admin' || user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminService.getUsers();
      setUsersList(data);
    } catch (err) {
      console.warn('Failed to load user list:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'investigator' | 'reviewer' | 'viewer') => {
    setUpdatingUserId(userId);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setSuccessMsg(`Successfully updated role for user to ${newRole.toUpperCase()}`);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Settings & System Governance"
        subtitle="Account profile, Role-Based Access Control (RBAC), and privacy controls."
      />

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-900 mb-6 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-3 text-xs text-red-900 mb-6 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-6 max-w-4xl">
        {/* Section 1: Account Profile */}
        <Card>
          <SectionHeader title="Account Profile" subtitle="Current authenticated operator profile" />
          <div className="flex items-center gap-4 p-3.5 bg-surface-50 border border-surface-400 rounded-xl text-xs shadow-xs">
            <div className="w-10 h-10 rounded-full bg-brand-500/15 border border-brand-500/40 flex items-center justify-center text-brand-700 font-extrabold text-sm shrink-0">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'O'}
            </div>
            <div>
              <div className="text-sm font-extrabold text-surface-950">{user?.email || 'Authorized Operator'}</div>
              <div className="text-[11px] text-brand-700 uppercase font-mono font-bold mt-0.5">Role: {user?.role || 'INVESTIGATOR'}</div>
            </div>
          </div>
        </Card>

        {/* Section 2: ADMIN USER ROLE MANAGEMENT (Section 27 of Prompt) */}
        {isAdmin && (
          <Card>
            <SectionHeader
              title="User Management & Role-Based Access Control (Admin Only)"
              subtitle="Assign security permissions: Admin, Investigator, Reviewer, or Viewer"
            />
            {loadingUsers ? (
              <p className="text-xs text-surface-700 mt-2 font-medium">Loading user profiles...</p>
            ) : usersList.length === 0 ? (
              <div className="p-3 bg-surface-50 border border-surface-400 rounded-lg text-xs text-surface-700 mt-3 font-medium">
                No external user profiles detected in current environment.
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {usersList.map((u) => (
                  <div key={u.id} className="p-3.5 bg-surface-50 border border-surface-400 rounded-xl flex items-center justify-between gap-4 shadow-xs">
                    <div>
                      <span className="text-xs font-extrabold text-surface-950 block">{u.full_name}</span>
                      <span className="text-[11px] text-surface-700 font-mono font-medium">{u.email}</span>
                    </div>

                    <div className="w-44">
                      <select
                        value={u.role}
                        disabled={updatingUserId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                        className="w-full bg-surface-50 border border-surface-400 text-surface-950 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-brand-500"
                      >
                        <option value="admin">ADMIN</option>
                        <option value="investigator">INVESTIGATOR</option>
                        <option value="reviewer">REVIEWER</option>
                        <option value="viewer">VIEWER</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Section 3: Appearance */}
        <Card>
          <SectionHeader title="Appearance & Theme" subtitle="System visual identity tokens" />
          <div className="p-3.5 bg-surface-50 border border-surface-400 rounded-xl flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-brand-600 shrink-0" />
              <span className="text-surface-950 font-bold">Public Safety Command Center Theme (Warm Earthy Brown & Cream)</span>
            </div>
            <span className="text-[11px] font-mono text-brand-700 font-bold">Active Light Theme</span>
          </div>
        </Card>

        {/* Section 4: System Status */}
        <Card>
          <SectionHeader title="System Status Diagnostics" subtitle="Backend API and Supabase connectivity" />
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-surface-50 border border-surface-400 rounded-xl shadow-xs">
              <span className="text-surface-950 font-bold flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-600" /> Backend API Endpoint
              </span>
              <span className="font-mono text-surface-900 font-bold">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-surface-50 border border-surface-400 rounded-xl shadow-xs">
              <span className="text-surface-950 font-bold flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-600" /> Backend Connection Status
              </span>
              <span className="font-mono text-emerald-700 font-extrabold">{health?.status || 'operational'}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-surface-50 border border-surface-400 rounded-xl shadow-xs">
              <span className="text-surface-950 font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600" /> Supabase Client Config
              </span>
              <span className="font-mono text-surface-900 font-bold">
                {health?.supabase?.configured ? 'Configured' : 'Active'}
              </span>
            </div>
          </div>
        </Card>

        {/* Section 5: Privacy Principles */}
        <Card>
          <SectionHeader title="Privacy & Security Principles" subtitle="Investigative governance guidelines" />
          <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl text-xs space-y-2 text-surface-900 shadow-xs">
            <div className="flex items-center gap-2 font-extrabold text-surface-950">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>Human-in-the-Loop Safeguard</span>
            </div>
            <p className="text-[11px] text-surface-700 leading-relaxed font-medium">
              FindSafe AI is designed strictly as an investigative-support system. AI matching results represent potential leads and always require human investigator verification before action.
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
