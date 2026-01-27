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

interface DashboardProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
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

export default function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/logs/recent?limit=10');
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
                <Link
                  href="/users"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  👥 Users
                </Link>
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
              <Link
                href="/2fa-setup"
                className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
              >
                🔐 2FA Setup
              </Link>
            </div>
          </div>
        </nav>

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
                  <span>{new Date().toLocaleString()}</span>
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
                    Online
                  </div>
                  <div className="text-stone-400 text-sm mt-1">Server Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="mt-6 bg-stone-800 border-4 border-stone-700 p-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4">
              Recent Actions (Last 24 Hours) 📝
            </h2>
            
            {loading ? (
              <div className="text-center py-8 text-stone-400">
                Loading activity...
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

  return {
    props: {
      user: session.user,
    },
  };
};
