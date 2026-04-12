'use client';

import { useCallback, useEffect, useState } from 'react';
import { Buildings, CircleNotch, Key, Plus, Trash, User, Warning, X } from '@phosphor-icons/react';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'UserManagementTab' });

interface SchoolSummary {
  id: string;
  name: string;
  municipality: string;
  hasAnthropicKey: boolean;
  hasOpenaiKey: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  schools: SchoolSummary[];
}

interface School {
  id: string;
  name: string;
  municipality: string;
}

type FetchState = 'loading' | 'ready' | 'error';

function formatSchool(s: { name: string; municipality: string }) {
  return s.municipality ? `${s.name} (${s.municipality})` : s.name;
}

export function UserManagementTab({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Add-school popover state
  const [addSchoolUserId, setAddSchoolUserId] = useState<string | null>(null);
  const [addSchoolId, setAddSchoolId] = useState('');
  const [addingSchool, setAddingSchool] = useState(false);
  const [addSchoolError, setAddSchoolError] = useState('');

  // Remove-membership state
  const [removingKey, setRemovingKey] = useState<string | null>(null); // "userId:schoolId"

  const loadAll = useCallback(async () => {
    setFetchState('loading');
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/schools'),
      ]);
      if (!usersRes.ok || !schoolsRes.ok) throw new Error('Failed to load');
      const [usersJson, schoolsJson] = await Promise.all([
        usersRes.json() as Promise<{ data: AdminUser[] }>,
        schoolsRes.json() as Promise<{ data: School[] }>,
      ]);
      setUsers(usersJson.data);
      setAllSchools(schoolsJson.data);
      setFetchState('ready');
    } catch (error) {
      logger.error({ error }, 'Failed to load');
      setFetchState('error');
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const response = await fetch(`/api/admin/users/${confirmDeleteId}`, { method: 'DELETE' });
      const json = await response.json() as { error?: string };
      if (!response.ok) {
        setDeleteError(json.error ?? 'Poistaminen epäonnistui.');
        return;
      }
      setConfirmDeleteId(null);
      void loadAll();
    } catch (error) {
      logger.error({ error }, 'Delete request failed');
      setDeleteError('Verkkovirhe. Yritä uudelleen.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddSchool = async (userId: string) => {
    if (!addSchoolId) return;
    setAddingSchool(true);
    setAddSchoolError('');
    try {
      const response = await fetch(`/api/admin/users/${userId}/memberships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: addSchoolId }),
      });
      const json = await response.json() as { error?: string };
      if (!response.ok) {
        setAddSchoolError(json.error ?? 'Lisääminen epäonnistui.');
        return;
      }
      setAddSchoolUserId(null);
      setAddSchoolId('');
      void loadAll();
    } catch (error) {
      logger.error({ error }, 'Add school failed');
      setAddSchoolError('Verkkovirhe. Yritä uudelleen.');
    } finally {
      setAddingSchool(false);
    }
  };

  const handleRemoveMembership = async (userId: string, schoolId: string) => {
    const key = `${userId}:${schoolId}`;
    setRemovingKey(key);
    try {
      const response = await fetch(`/api/admin/users/${userId}/memberships/${schoolId}`, {
        method: 'DELETE',
      });
      const json = await response.json() as { error?: string };
      if (!response.ok) {
        alert(json.error ?? 'Poistaminen epäonnistui.');
        return;
      }
      void loadAll();
    } catch (error) {
      logger.error({ error }, 'Remove membership failed');
      alert('Verkkovirhe. Yritä uudelleen.');
    } finally {
      setRemovingKey(null);
    }
  };

  const userToDelete = users.find((u) => u.id === confirmDeleteId);

  if (fetchState === 'loading') {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <CircleNotch size={24} weight="bold" className="animate-spin" />
      </div>
    );
  }

  if (fetchState === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
        Käyttäjien lataaminen epäonnistui.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{users.length} käyttäjää</p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          Ei käyttäjiä.
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const isAddingForThis = addSchoolUserId === user.id;
            // Schools the user does NOT already belong to
            const availableSchools = allSchools.filter(
              (s) => !user.schools.some((ms) => ms.id === s.id)
            );

            return (
              <div
                key={user.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <User size={18} weight="duotone" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {user.name || '—'}
                      </span>
                      <span className="text-sm text-slate-500">{user.email}</span>
                      {user.id === currentUserId && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                          sinä
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      Rekisteröitynyt {new Date(user.createdAt).toLocaleDateString('fi-FI')}
                    </div>
                  </div>

                  {user.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => { setConfirmDeleteId(user.id); setDeleteError(''); }}
                      aria-label={`Poista käyttäjä ${user.name || user.email}`}
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <Trash size={16} weight="duotone" />
                    </button>
                  )}
                </div>

                {/* Schools list */}
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {user.schools.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Ei koulua</p>
                  ) : (
                    user.schools.map((school) => {
                      const rKey = `${user.id}:${school.id}`;
                      const isRemoving = removingKey === rKey;
                      return (
                        <div key={school.id} className="flex items-center gap-2">
                          <Buildings size={12} className="shrink-0 text-slate-400" />
                          <span className="min-w-0 flex-1 text-xs text-slate-700 dark:text-slate-300">
                            {formatSchool(school)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Key size={11} />
                            {[
                              school.hasAnthropicKey && 'Anthropic',
                              school.hasOpenaiKey && 'OpenAI',
                            ].filter(Boolean).join(', ') || 'Ei avainta'}
                          </span>
                          {user.id !== currentUserId && (
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => handleRemoveMembership(user.id, school.id)}
                              aria-label={`Poista ${school.name}-jäsenyys`}
                              className="shrink-0 rounded p-0.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                            >
                              {isRemoving
                                ? <CircleNotch size={12} weight="bold" className="animate-spin" />
                                : <X size={12} weight="bold" />}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Add school row */}
                  {user.id !== currentUserId && availableSchools.length > 0 && (
                    isAddingForThis ? (
                      <div className="flex items-center gap-2 pt-1">
                        <select
                          value={addSchoolId}
                          onChange={(e) => { setAddSchoolId(e.target.value); setAddSchoolError(''); }}
                          className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <option value="">-- Valitse koulu --</option>
                          {availableSchools.map((s) => (
                            <option key={s.id} value={s.id}>{formatSchool(s)}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!addSchoolId || addingSchool}
                          onClick={() => handleAddSchool(user.id)}
                          className="shrink-0 rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                        >
                          {addingSchool ? <CircleNotch size={12} weight="bold" className="animate-spin" /> : 'Lisää'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddSchoolUserId(null); setAddSchoolId(''); setAddSchoolError(''); }}
                          className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X size={12} weight="bold" />
                        </button>
                        {addSchoolError && (
                          <span className="text-xs text-red-600">{addSchoolError}</span>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setAddSchoolUserId(user.id); setAddSchoolId(''); setAddSchoolError(''); }}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        <Plus size={11} weight="bold" />
                        Lisää koulu
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete user confirmation dialog */}
      {confirmDeleteId && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                <Warning size={20} weight="duotone" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Poista käyttäjä</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Poistetaan <span className="font-medium">{userToDelete.name || userToDelete.email}</span>
                  {userToDelete.schools.length > 0 && (
                    <> ({userToDelete.schools.map((s) => s.name).join(', ')})</>
                  )}.
                </p>
              </div>
            </div>

            <ul className="mb-4 space-y-1 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <li>✓ Käyttäjätili poistetaan pysyvästi</li>
              <li>✓ Kouluihin liitetyt API-avaimet poistetaan</li>
              <li>✓ Koulun jäsenyydet poistetaan</li>
              <li className="text-slate-400">– Koulu ja harjoitukset säilytetään</li>
            </ul>

            {deleteError && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setConfirmDeleteId(null); setDeleteError(''); }}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Peruuta
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                ) : (
                  <Trash size={16} weight="duotone" />
                )}
                {deleting ? 'Poistetaan...' : 'Poista'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
