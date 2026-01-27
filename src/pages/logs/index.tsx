/**
 * Activity Logs Page
 * Password-protected for Super Admins, read-only for Moderators
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ActivityLog {
  id: string;
  actionType: string;
  resource: string | null;
  resourceId: string | null;
  details: string | null;
  timestamp: string;
  ipAddress: string | null;
  user: {
    name: string;
    email: string;
    role: {
      name: string;
    };
  };
}

interface LogsPageProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function LogsPage({ user }: LogsPageProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(user.role !== 'Super Admin'); // Auto-auth for non-Super Admins
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [filters, setFilters] = useState({
    hours: '24',
    actionType: '',
    userId: '',
  });

  useEffect(() => {
    if (authenticated) {
      fetchLogs();
    }
  }, [authenticated, filters]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify password via API
    fetch('/api/logs/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then(async (response) => {
        if (response.ok) {
          setAuthenticated(true);
          setPasswordError('');
        } else {
          const data = await response.json();
          setPasswordError(data.error || 'Invalid password');
        }
      })
      .catch(() => {
        setPasswordError('An error occurred');
      });
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');
      
      if (filters.actionType) {
        params.append('actionType', filters.actionType);
      }
      
      if (filters.userId) {
        params.append('userId', filters.userId);
      }

      if (filters.hours) {
        const startDate = new Date(Date.now() - parseInt(filters.hours) * 60 * 60 * 1000);
        params.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`/api/logs?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      } else if (response.status === 403) {
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    if (actionType === 'login') return '🔐';
    if (actionType === 'logout') return '🚪';
    if (actionType.includes('user')) return '👤';
    if (actionType.includes('role')) return '👥';
    if (actionType.includes('server')) return '🖥️';
    return '📝';
  };

  const formatActionType = (actionType: string) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionColor = (actionType: string) => {
    if (actionType === 'login') return 'text-green-400';
    if (actionType === 'logout') return 'text-yellow-400';
    if (actionType.includes('delete')) return 'text-red-400';
    if (actionType.includes('create')) return 'text-blue-400';
    if (actionType.includes('update')) return 'text-purple-400';
    return 'text-stone-300';
  };

  // Password protection for Super Admins
  if (user.role === 'Super Admin' && !authenticated) {
    return (
      <>
        <Head>
          <title>Activity Logs - SMP Admin Panel</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-green-950 to-stone-900">
          <div className="bg-stone-800 border-4 border-stone-700 p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                Protected Area
              </h2>
              <p className="text-stone-400">
                Enter password to access activity logs
              </p>
            </div>

            {passwordError && (
              <div className="mb-4 bg-red-900/50 border-2 border-red-700 p-3 text-red-200 text-sm">
                ⚠️ {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-3 focus:border-green-500 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 border-b-4 border-green-800"
              >
                Access Logs
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/dashboard"
                className="text-green-400 hover:text-green-300 text-sm"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Activity Logs - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-green-950 to-stone-900">
        {/* Header */}
        <header className="bg-stone-800 border-b-4 border-stone-700 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">⛏️</span>
              <div>
                <h1 className="text-2xl font-bold text-green-400" style={{ 
                  textShadow: '2px 2px 0 rgba(0,0,0,0.8)'
                }}>
                  SMP Admin Panel
                </h1>
                <p className="text-stone-400 text-sm">Activity Logs</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-green-400 hover:text-green-300 font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-stone-800 border-4 border-stone-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                📋 Activity Logs
              </h2>
              <button
                onClick={fetchLogs}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 border-b-4 border-green-800"
              >
                ↻ Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-green-400 font-semibold mb-2 text-sm">
                  Time Range
                </label>
                <select
                  value={filters.hours}
                  onChange={(e) => setFilters({ ...filters, hours: e.target.value })}
                  className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                >
                  <option value="1">Last Hour</option>
                  <option value="6">Last 6 Hours</option>
                  <option value="24">Last 24 Hours</option>
                  <option value="168">Last Week</option>
                  <option value="">All Time</option>
                </select>
              </div>

              <div>
                <label className="block text-green-400 font-semibold mb-2 text-sm">
                  Action Type
                </label>
                <select
                  value={filters.actionType}
                  onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                  className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                >
                  <option value="">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="create_user">Create User</option>
                  <option value="update_user">Update User</option>
                  <option value="delete_user">Delete User</option>
                  <option value="update_role">Update Role</option>
                </select>
              </div>

              <div>
                <label className="block text-green-400 font-semibold mb-2 text-sm">
                  Showing
                </label>
                <div className="bg-stone-900 border-2 border-stone-700 px-4 py-2 text-white">
                  {logs.length} logs
                </div>
              </div>
            </div>

            {/* Logs List */}
            {loading ? (
              <div className="text-center py-12 text-stone-400">
                Loading logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                No logs found
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-stone-900 border-2 border-stone-700 p-4 hover:border-green-700 transition-all"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">{getActionIcon(log.actionType)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-white font-semibold">{log.user.name}</span>
                            <span className="text-stone-400 mx-2">•</span>
                            <span className={`font-semibold ${getActionColor(log.actionType)}`}>
                              {formatActionType(log.actionType)}
                            </span>
                            {log.resource && (
                              <>
                                <span className="text-stone-400 mx-2">→</span>
                                <span className="text-stone-400">{log.resource}</span>
                              </>
                            )}
                          </div>
                          <span className="text-stone-500 text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-stone-500">
                          <span>Role: {log.user.role.name}</span>
                          {log.ipAddress && (
                            <>
                              <span>•</span>
                              <span>IP: {log.ipAddress}</span>
                            </>
                          )}
                        </div>
                        {log.details && (
                          <div className="mt-2 bg-stone-950 border border-stone-800 p-2 text-stone-400 text-sm font-mono">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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

  // Only Super Admins and Moderators can access logs
  if (session.user.role !== 'Super Admin' && session.user.role !== 'Moderator') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: session.user,
    },
  };
};
