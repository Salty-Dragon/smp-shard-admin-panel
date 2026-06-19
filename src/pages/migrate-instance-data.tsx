/**
 * Migrate Instance Data Page
 * Super Admin only - backfill instanceId on existing database records
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import AppShell from '@/components/AppShell';
import { useEffect, useState, useCallback } from 'react';
import { getDefaultInstance } from '@/lib/serverInstances';

interface MigrateInstanceDataProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  defaultInstanceId: string;
}

interface TableStats {
  withInstance: number;
  withoutInstance: number;
  total: number;
}

interface MigrationStatus {
  needsMigration: boolean;
  statistics: {
    activityLogs: TableStats;
    serverMetrics: TableStats;
    scheduledTasks: TableStats;
  };
}

interface MigrationResults {
  activityLogs: { toMigrate: number; migrated: number };
  serverMetrics: { toMigrate: number; migrated: number };
  scheduledTasks: { toMigrate: number; migrated: number };
  totalMigrated: number;
}

export default function MigrateInstanceDataPage({ user, defaultInstanceId }: MigrateInstanceDataProps) {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [instanceId, setInstanceId] = useState(defaultInstanceId);
  const [migrating, setMigrating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [results, setResults] = useState<MigrationResults | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/apanel44/api/admin/migrate-instance-data');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setError('Failed to fetch migration status');
      }
    } catch (err) {
      console.error('Error fetching migration status:', err);
      setError('Error loading migration status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const totalWithout = status
    ? status.statistics.activityLogs.withoutInstance +
      status.statistics.serverMetrics.withoutInstance +
      status.statistics.scheduledTasks.withoutInstance
    : 0;

  const handleRunMigration = async () => {
    setMigrating(true);
    setError('');
    setSuccess('');
    setShowConfirm(false);
    try {
      const response = await fetch('/apanel44/api/admin/migrate-instance-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setResults(data.results);
        setSuccess(`Migration completed successfully. ${data.results.totalMigrated} record(s) updated with instanceId "${data.instanceId}".`);
        await fetchStatus();
      } else {
        setError(data.message || 'Migration failed');
      }
    } catch (err) {
      console.error('Error running migration:', err);
      setError('Error running migration');
    } finally {
      setMigrating(false);
    }
  };

  const isValidInstanceId = instanceId.trim().length > 0;

  return (
    <>
      <Head>
        <title>Migrate Instance Data - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AppShell user={user} active="migrate">


        {/* Main Content */}
        <div className="space-y-6">
          <div className="glass border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                🔄 Migrate Instance Data
              </h2>
            </div>

            <p className="text-gray-400 mb-6">
              Backfill <code className="bg-black/30 px-1 text-green-300">instanceId</code> on existing database records.
              Use this when upgrading from a single-instance to a multi-instance setup.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 mb-4 text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 p-4 mb-4 text-green-300">
                {success}
              </div>
            )}

            {/* Migration Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-green-400">Migration Status</h3>
                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="text-sm bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-300 px-3 py-1 border-2 border-white/10 font-semibold"
                  aria-label="Refresh migration status"
                >
                  {loading ? 'Refreshing...' : '🔃 Refresh'}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading migration status...</div>
              ) : status ? (
                <>
                  {!status.needsMigration ? (
                    <div className="bg-green-500/10 border border-green-500/30 p-4 mb-4 text-green-300 flex items-center space-x-2">
                      <span className="text-xl">✅</span>
                      <span>All records are already tagged with an instance ID. No migration needed.</span>
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 mb-4 text-yellow-300 flex items-center space-x-2">
                      <span className="text-xl">⚠️</span>
                      <span>{totalWithout} record(s) are missing an instance ID and need migration.</span>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-white/10">
                      <thead>
                        <tr className="bg-black/30 text-gray-400">
                          <th className="text-left px-4 py-3 border-b border-white/10">Table</th>
                          <th className="text-right px-4 py-3 border-b border-white/10">With Instance</th>
                          <th className="text-right px-4 py-3 border-b border-white/10">Without Instance</th>
                          <th className="text-right px-4 py-3 border-b border-white/10">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/10">
                          <td className="px-4 py-3 text-green-400 font-semibold">ActivityLog</td>
                          <td className="text-right px-4 py-3 text-gray-300">{status.statistics.activityLogs.withInstance}</td>
                          <td className={`text-right px-4 py-3 ${status.statistics.activityLogs.withoutInstance > 0 ? 'text-yellow-400 font-semibold' : 'text-gray-300'}`}>
                            {status.statistics.activityLogs.withoutInstance}
                          </td>
                          <td className="text-right px-4 py-3 text-gray-400">{status.statistics.activityLogs.total}</td>
                        </tr>
                        <tr className="border-b border-white/10">
                          <td className="px-4 py-3 text-green-400 font-semibold">ServerMetrics</td>
                          <td className="text-right px-4 py-3 text-gray-300">{status.statistics.serverMetrics.withInstance}</td>
                          <td className={`text-right px-4 py-3 ${status.statistics.serverMetrics.withoutInstance > 0 ? 'text-yellow-400 font-semibold' : 'text-gray-300'}`}>
                            {status.statistics.serverMetrics.withoutInstance}
                          </td>
                          <td className="text-right px-4 py-3 text-gray-400">{status.statistics.serverMetrics.total}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-green-400 font-semibold">ScheduledTask</td>
                          <td className="text-right px-4 py-3 text-gray-300">{status.statistics.scheduledTasks.withInstance}</td>
                          <td className={`text-right px-4 py-3 ${status.statistics.scheduledTasks.withoutInstance > 0 ? 'text-yellow-400 font-semibold' : 'text-gray-300'}`}>
                            {status.statistics.scheduledTasks.withoutInstance}
                          </td>
                          <td className="text-right px-4 py-3 text-gray-400">{status.statistics.scheduledTasks.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>

            {/* Migration Results */}
            {results && (
              <div className="mb-6 bg-black/30 border border-green-500/30 p-4">
                <h3 className="text-lg font-semibold text-green-400 mb-3">Migration Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="glass border border-white/10 px-4 py-3">
                    <div className="text-gray-400 text-sm mb-1">ActivityLog</div>
                    <div className="text-green-400 font-bold text-xl">{results.activityLogs.migrated}</div>
                    <div className="text-gray-500 text-xs">records migrated</div>
                  </div>
                  <div className="glass border border-white/10 px-4 py-3">
                    <div className="text-gray-400 text-sm mb-1">ServerMetrics</div>
                    <div className="text-green-400 font-bold text-xl">{results.serverMetrics.migrated}</div>
                    <div className="text-gray-500 text-xs">records migrated</div>
                  </div>
                  <div className="glass border border-white/10 px-4 py-3">
                    <div className="text-gray-400 text-sm mb-1">ScheduledTask</div>
                    <div className="text-green-400 font-bold text-xl">{results.scheduledTasks.migrated}</div>
                    <div className="text-gray-500 text-xs">records migrated</div>
                  </div>
                </div>
                <div className="text-gray-400 text-sm">
                  Total records updated: <span className="text-green-400 font-semibold">{results.totalMigrated}</span>
                </div>
              </div>
            )}

            {/* Migration Form */}
            <div className="bg-black/30 border border-white/10 p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Run Migration</h3>

              <div className="mb-4">
                <label htmlFor="instanceId" className="block text-gray-400 text-sm font-semibold mb-2">
                  Instance ID to assign
                </label>
                <input
                  id="instanceId"
                  type="text"
                  value={instanceId}
                  onChange={(e) => setInstanceId(e.target.value)}
                  placeholder="e.g. s1, s2, dev, live"
                  className="glass border-2 border-white/10 text-gray-200 px-4 py-2 w-full max-w-xs focus:border-green-500 focus:outline-none"
                  disabled={migrating}
                />
                <p className="text-gray-500 text-xs mt-1">
                  All records without an instance ID will be assigned this value.
                </p>
              </div>

              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!isValidInstanceId || migrating}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-semibold"
                  aria-label="Run migration"
                >
                  🔄 Run Migration
                </button>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4">
                  <p className="text-yellow-300 font-semibold mb-3">
                    ⚠️ This will update {totalWithout} record(s) and set their instanceId to &quot;{instanceId}&quot;. Are you sure?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleRunMigration}
                      disabled={migrating}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-white/5 text-white px-6 py-2 rounded-xl font-semibold"
                      aria-label="Confirm and run migration"
                    >
                      {migrating ? 'Migrating...' : '✅ Yes, Run Migration'}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      disabled={migrating}
                      className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-semibold"
                      aria-label="Cancel migration"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-black/30 border border-white/10">
              <p className="text-gray-400 text-sm">
                ℹ️ This migration is safe to run multiple times — only records with a <code className="glass px-1 text-green-300">null</code> instanceId will be updated.
                Records that already have an instanceId will not be changed.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Only Super Admins can access this page
  if (session.user.role !== 'Super Admin') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  let defaultInstanceId = 'default';
  try {
    const instance = getDefaultInstance();
    defaultInstanceId = instance.id;
  } catch {
    // Use 'default' if no instances configured
  }

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };

  return {
    props: {
      user,
      defaultInstanceId,
    },
  };
};
