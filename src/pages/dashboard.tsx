/**
 * Dashboard Page for SMP Admin Panel
 * Protected route - requires authentication
 * Shows recent activity and server status
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import packageJson from '../../package.json';
import ErrorReportModal from '@/components/ErrorReportModal';
import ServerMonitoringPanel from '@/components/ServerMonitoringPanel';
import ServerVersionCard from '@/components/ServerVersionCard';
import Toast from '@/components/Toast';
import Spinner from '@/components/Spinner';
import InstanceSelector from '@/components/InstanceSelector';
import { useInstance } from '@/contexts/InstanceContext';

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
  const { currentInstance, setCurrentInstance } = useInstance();

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

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
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

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <>
      <Head>
        <title>Dashboard - SMP Admin Panel</title>
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
                <p className="text-stone-400 text-sm">Server Management System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowErrorReportModal(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 border-b-4 border-yellow-800 active:border-b-0 active:mt-1 font-semibold"
                title="Submit Error Report"
              >
                🐛 Report Issue
              </button>
              <div className="text-right">
                <p className="text-white font-semibold">{user.name}</p>
                <p className="text-stone-400 text-sm">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 border-b-4 border-red-800 active:border-b-0 active:mt-1 font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-stone-800/50 border-b-2 border-stone-700">
          <div className="container mx-auto px-4">
            <div className="flex space-x-1">
              <Link
                href="/dashboard"
                className="px-6 py-3 text-green-400 font-semibold border-b-4 border-green-500"
              >
                📊 Dashboard
              </Link>
              {(user.role === 'Super Admin' || user.role === 'Admin') && (
                <>
                  <Link
                    href="/users"
                    className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                  >
                    👥 Users
                  </Link>
                  <Link
                    href="/console"
                    className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                  >
                    ⌨️ Console
                  </Link>
                  <Link
                    href="/plugins"
                    className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                  >
                    🔌 Plugins
                  </Link>
                </>
              )}
              {user.role === 'Super Admin' && (
                <Link
                  href="/roles"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  🛡️ Roles
                </Link>
              )}
              {(user.role === 'Super Admin' || user.role === 'Moderator') && (
                <Link
                  href="/logs"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  📋 Logs
                </Link>
              )}
              {user.role === 'Super Admin' && (
                <Link
                  href="/error-reports"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  🐛 Error Reports
                </Link>
              )}
              {(user.role === 'Super Admin' || user.role === 'Admin') && (
                <Link
                  href="/scheduled-tasks"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  ⏰ Tasks
                </Link>
              )}
              {user.role === 'Super Admin' && (
                <Link
                  href="/metrics-settings"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  ⚙️ Metrics
                </Link>
              )}
              <Link
                href="/2fa-setup"
                className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
              >
                🔐 2FA Setup
              </Link>
            </div>
          </div>
        </nav>

        {/* Instance Selector Bar */}
        <div className="bg-stone-800/30 border-b border-stone-700">
          <div className="container mx-auto px-4 py-3">
            <InstanceSelector
              currentInstance={currentInstance || undefined}
              onInstanceChange={(id) => setCurrentInstance(id)}
              className="justify-center"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Welcome Card */}
            <div className="bg-stone-800 border-4 border-stone-700 p-6">
              <h2 className="text-2xl font-bold text-green-400 mb-4">
                Welcome back, {user.name}! 👋
              </h2>
              <div className="space-y-3">
                <div className="flex items-center text-stone-300">
                  <span className="mr-3">📧</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center text-stone-300">
                  <span className="mr-3">👤</span>
                  <span>Role: <span className="text-green-400 font-semibold">{user.role}</span></span>
                </div>
                <div className="flex items-center text-stone-300">
                  <span className="mr-3">🕒</span>
                  <span>{currentTime || 'Loading...'}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-stone-800 border-4 border-stone-700 p-6">
              <h2 className="text-2xl font-bold text-green-400 mb-4">
                Quick Stats 📊
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-900 border-2 border-stone-700 p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {recentActivity.length}
                  </div>
                  <div className="text-stone-400 text-sm mt-1">Recent Actions</div>
                </div>
                <div className="bg-stone-900 border-2 border-stone-700 p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {playerCount}
                  </div>
                  <div className="text-stone-400 text-sm mt-1">Players Online</div>
                </div>
                <div className="bg-stone-900 border-2 border-stone-700 p-4 text-center">
                  <div className={`text-3xl font-bold ${
                    serverStatusError ? 'text-yellow-400' :
                    serverOnline === null ? 'text-stone-400' : 
                    serverOnline ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {serverStatusError ? 'Error' :
                     serverOnline === null ? 'Checking...' : 
                     serverOnline ? 'Online' : 'Offline'}
                  </div>
                  <div className="text-stone-400 text-sm mt-1">
                    {serverStatusError ? 'Unable to check' : 'Server Status'}
                  </div>
                </div>
                {user.role === 'Super Admin' && (
                  <>
                    <div className="bg-stone-900 border-2 border-stone-700 p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-400">
                        {errorReports.length}
                      </div>
                      <div className="text-stone-400 text-sm mt-1">Open Reports</div>
                    </div>
                    <Link
                      href="/all-stats"
                      className="bg-stone-900 border-2 border-stone-700 hover:border-green-600 p-4 text-center transition-all"
                    >
                      <div className="text-3xl font-bold text-green-400">
                        →
                      </div>
                      <div className="text-stone-400 text-sm mt-1">View All</div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Server Version Card (Admin/Super Admin only) */}
          {(user.role === 'Super Admin' || user.role === 'Admin') && (
            <div className="mt-6">
              <ServerVersionCard />
            </div>
          )}

          {/* Server Monitoring Panel (Admin/Super Admin only) */}
          {(user.role === 'Super Admin' || user.role === 'Admin') && (
            <div className="mt-6">
              <ServerMonitoringPanel />
            </div>
          )}

          {/* Error Reports Widget (Super Admin only) */}
          {user.role === 'Super Admin' && errorReports.length > 0 && (
            <div className="mt-6 bg-stone-800 border-4 border-stone-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-yellow-400">
                  🐛 Recent Error Reports
                </h2>
                <Link
                  href="/error-reports"
                  className="text-green-400 hover:text-green-300 font-semibold"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-2">
                {errorReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-stone-900 border-2 border-stone-700 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <span className={`text-2xl ${
                        report.severity === 'critical' ? '🔴' :
                        report.severity === 'high' ? '🟠' :
                        report.severity === 'medium' ? '🟡' : '🟢'
                      }`}>
                        {report.severity === 'critical' ? '🔴' :
                         report.severity === 'high' ? '🟠' :
                         report.severity === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <div>
                        <p className="text-white font-semibold">{report.title}</p>
                        <p className="text-stone-500 text-sm">
                          Reported by {report.user.name} • {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-stone-400 text-sm uppercase">
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Feed */}
          <div className="mt-6 bg-stone-800 border-4 border-stone-700 p-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4">
              Recent Actions (Last 24 Hours) 📝
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <Spinner size="large" message="Loading activity..." />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                No recent activity
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="bg-stone-900 border-2 border-stone-700 p-4 flex items-start space-x-4"
                  >
                    <div className="text-3xl">{getActionIcon(log.actionType)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-green-400 font-semibold">
                            {log.user.name}
                          </span>
                          <span className="text-stone-400 mx-2">•</span>
                          <span className="text-stone-300">
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
                          {formatTimeAgo(log.timestamp)}
                        </span>
                      </div>
                      <div className="text-stone-500 text-sm mt-1">
                        {log.user.role.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recentActivity.length > 0 && (
              <div className="mt-4 text-center">
                <Link
                  href="/logs"
                  className="text-green-400 hover:text-green-300 font-semibold"
                >
                  View All Logs →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Version */}
        <footer className="bg-stone-800 border-t-4 border-stone-700 mt-8">
          <div className="container mx-auto px-4 py-4 text-center">
            <p className="text-stone-400 text-sm">
              SMP Admin Panel v{version} | © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>

      {/* Error Report Modal */}
      <ErrorReportModal
        isOpen={showErrorReportModal}
        onClose={() => setShowErrorReportModal(false)}
        onSuccess={handleErrorReportSuccess}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
