/**
 * Dashboard Page for SMP Admin Panel
 * Protected route - requires authentication
 * Shows recent activity and server status
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bug,
  Mail,
  User as UserIcon,
  Clock,
  ArrowRight,
  Activity,
  Circle,
  LogIn,
  LogOut,
  Server,
  Users as UsersIcon,
  FileText,
} from 'lucide-react';
import packageJson from '../../package.json';
import ErrorReportModal from '@/components/ErrorReportModal';
import ServerMonitoringPanel from '@/components/ServerMonitoringPanel';
import ServerVersionCard from '@/components/ServerVersionCard';
import Toast from '@/components/Toast';
import Spinner from '@/components/Spinner';
import Card from '@/components/Card';
import AppShell from '@/components/AppShell';
import { useInstance } from '@/contexts/InstanceContext';
import { cn } from '@/lib/cn';

interface DashboardProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  version: string;
}

interface ActivityLog {
  id: string;
  actionType: string;
  resource: string | null;
  details: string | null;
  timestamp: string;
  user: {
    name: string;
    email: string;
    role: {
      name: string;
    };
  };
}

interface ErrorReport {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
  };
}

export default function Dashboard({ user, version }: DashboardProps) {
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null); // null = checking, true = online, false = offline
  const [serverStatusError, setServerStatusError] = useState<boolean>(false); // true = API error, false = no error
  const [loading, setLoading] = useState(true);
  const [showErrorReportModal, setShowErrorReportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Get current instance from context
  const { currentInstance } = useInstance();

  useEffect(() => {
    // Set current time on client side only to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString());

    fetchRecentActivity();
    fetchServerStatus();
    if (user.role === 'Super Admin') {
      fetchErrorReports();
    }

    // Set up periodic refresh for server status every 10 seconds
    const interval = setInterval(() => {
      fetchServerStatus();
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInstance]); // Re-fetch when instance changes

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/apanel44/api/logs/recent?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.logs);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerStatus = async () => {
    try {
      const url = currentInstance
        ? `/apanel44/api/monitoring/server-status?instanceId=${encodeURIComponent(currentInstance)}`
        : '/apanel44/api/monitoring/server-status';

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.status) {
          setServerOnline(data.status.online);
          setPlayerCount(data.status.playerCount);
          setServerStatusError(false); // API call successful
        }
      } else {
        // API returned an error status code
        console.error('Server status API returned error:', response.status);
        setServerStatusError(true);
        // Keep previous values if we had them
      }
    } catch (error) {
      // Network error or API unavailable
      console.error('Error fetching server status:', error);
      setServerStatusError(true);
      // Keep previous values if we had them, or show as checking
      if (serverOnline === null) {
        setServerOnline(null); // Still checking
      }
    }
  };

  const fetchErrorReports = async () => {
    try {
      const response = await fetch('/apanel44/api/error-reports?status=open&limit=5');
      if (response.ok) {
        const data = await response.json();
        setErrorReports(data.errorReports || []);
      }
    } catch (error) {
      console.error('Error fetching error reports:', error);
    }
  };

  const handleErrorReportSuccess = () => {
    setToast({ message: 'Error report submitted successfully', type: 'success' });
    if (user.role === 'Super Admin') {
      fetchErrorReports();
    }
  };

  const ActionIcon = ({ actionType }: { actionType: string }) => {
    const cls = 'h-5 w-5 text-green-400';
    if (actionType === 'login') return <LogIn className={cls} />;
    if (actionType === 'logout') return <LogOut className={cls} />;
    if (actionType.includes('user')) return <UserIcon className={cls} />;
    if (actionType.includes('role')) return <UsersIcon className={cls} />;
    if (actionType.includes('server')) return <Server className={cls} />;
    return <FileText className={cls} />;
  };

  const formatActionType = (actionType: string) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const severityColor = (severity: string) => {
    if (severity === 'critical') return 'text-red-400 fill-red-400';
    if (severity === 'high') return 'text-orange-400 fill-orange-400';
    if (severity === 'medium') return 'text-yellow-400 fill-yellow-400';
    return 'text-green-400 fill-green-400';
  };

  const statusText = serverStatusError
    ? 'Error'
    : serverOnline === null
      ? 'Checking…'
      : serverOnline
        ? 'Online'
        : 'Offline';
  const statusColor = serverStatusError
    ? 'text-yellow-400'
    : serverOnline === null
      ? 'text-gray-400'
      : serverOnline
        ? 'text-green-400'
        : 'text-red-400';

  const reportButton = (
    <button
      onClick={() => setShowErrorReportModal(true)}
      className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 px-4 py-2 text-amber-300 hover:bg-amber-500/10 font-medium transition-all"
      title="Submit Error Report"
    >
      <Bug className="h-4 w-4" />
      <span className="hidden sm:inline">Report Issue</span>
    </button>
  );

  return (
    <>
      <Head>
        <title>Dashboard - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AppShell user={user} active="dashboard" headerActions={reportButton}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Welcome Card */}
            <Card>
              <h2 className="text-xl font-bold text-green-400 text-glow mb-4">Welcome back, {user.name}!</h2>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-green-400/70" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 text-green-400/70" />
                  <span>
                    Role: <span className="text-green-400 font-semibold">{user.role}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-green-400/70" />
                  <span className="font-mono text-sm">{currentTime || 'Loading…'}</span>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card>
              <h2 className="text-xl font-bold text-green-400 text-glow mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/30 border border-white/5 p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{recentActivity.length}</div>
                  <div className="text-gray-400 text-sm mt-1">Recent Actions</div>
                </div>
                <div className="rounded-xl bg-black/30 border border-white/5 p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{playerCount}</div>
                  <div className="text-gray-400 text-sm mt-1">Players Online</div>
                </div>
                <div className="rounded-xl bg-black/30 border border-white/5 p-4 text-center">
                  <div className={cn('text-3xl font-bold', statusColor)}>{statusText}</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {serverStatusError ? 'Unable to check' : 'Server Status'}
                  </div>
                </div>
                {user.role === 'Super Admin' && (
                  <>
                    <div className="rounded-xl bg-black/30 border border-white/5 p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-400">{errorReports.length}</div>
                      <div className="text-gray-400 text-sm mt-1">Open Reports</div>
                    </div>
                    <Link
                      href="/all-stats"
                      className="rounded-xl bg-black/30 border border-white/5 hover:border-green-500/40 p-4 text-center transition-all flex flex-col items-center justify-center"
                    >
                      <ArrowRight className="h-7 w-7 text-green-400" />
                      <div className="text-gray-400 text-sm mt-1">View All</div>
                    </Link>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Server Version Card (Admin/Super Admin only) */}
          {(user.role === 'Super Admin' || user.role === 'Admin') && <ServerVersionCard />}

          {/* Server Monitoring Panel (Admin/Super Admin only) */}
          {(user.role === 'Super Admin' || user.role === 'Admin') && <ServerMonitoringPanel />}

          {/* Error Reports Widget (Super Admin only) */}
          {user.role === 'Super Admin' && errorReports.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                  <Bug className="h-5 w-5" /> Recent Error Reports
                </h2>
                <Link href="/error-reports" className="text-green-400 hover:text-green-300 font-medium text-sm inline-flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-2">
                {errorReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl bg-black/30 border border-white/5 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Circle className={cn('h-3 w-3', severityColor(report.severity))} />
                      <div>
                        <p className="text-white font-semibold">{report.title}</p>
                        <p className="text-gray-500 text-sm">
                          Reported by {report.user.name} • {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs uppercase font-mono">{report.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Activity Feed */}
          <Card>
            <h2 className="text-xl font-bold text-green-400 text-glow mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" /> Recent Actions (Last 24 Hours)
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <Spinner size="large" message="Loading activity…" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No recent activity</div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl bg-black/30 border border-white/5 p-4 flex items-start gap-4"
                  >
                    <div className="mt-0.5">
                      <ActionIcon actionType={log.actionType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-green-400 font-semibold">{log.user.name}</span>
                          <span className="text-gray-600 mx-2">•</span>
                          <span className="text-gray-300">{formatActionType(log.actionType)}</span>
                          {log.resource && (
                            <>
                              <span className="text-gray-600 mx-2">→</span>
                              <span className="text-gray-400">{log.resource}</span>
                            </>
                          )}
                        </div>
                        <span className="text-gray-500 text-sm flex-shrink-0">{formatTimeAgo(log.timestamp)}</span>
                      </div>
                      <div className="text-gray-500 text-sm mt-1">{log.user.role.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recentActivity.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/logs" className="text-green-400 hover:text-green-300 font-medium text-sm inline-flex items-center gap-1">
                  View All Logs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </Card>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm pt-2">
            SMP Admin Panel v{version} | © {new Date().getFullYear()}
          </p>
        </div>
      </AppShell>

      {/* Error Report Modal */}
      <ErrorReportModal
        isOpen={showErrorReportModal}
        onClose={() => setShowErrorReportModal(false)}
        onSuccess={handleErrorReportSuccess}
      />

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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

  // Ensure all user fields are serializable (no undefined values)
  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };

  return {
    props: {
      user,
      version: packageJson.version,
    },
  };
};
