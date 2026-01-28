/**
 * All Stats Page - Detailed server statistics and monitoring
 * Protected route - requires Admin/Super Admin authentication
 * Shows detailed trends and historical data
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Spinner from '@/components/Spinner';

interface AllStatsProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface MetricsData {
  timestamp: string;
  cpuUsage: number;
  memoryUsagePercent: number;
  playerCount: number | null;
  diskUsage: number | null;
  serverOnline: boolean;
}

export default function AllStats({ user }: AllStatsProps) {
  const [metricsData, setMetricsData] = useState<MetricsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<10 | 30>(30);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchHistoricalMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    // Set up auto-refresh if enabled
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchHistoricalMetrics();
      }, refreshInterval * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval, timeRange, customStartDate, customEndDate]);

  const fetchHistoricalMetrics = async () => {
    setLoading(true);
    try {
      let url = `/apanel44/api/monitoring/history?timeRange=${timeRange}`;
      
      // If custom date range is selected and dates are provided
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        url = `/apanel44/api/monitoring/history?startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.metrics && data.metrics.length > 0) {
          setMetricsData(data.metrics.map((m: {
            timestamp: string | Date;
            cpuUsage: number;
            memoryUsagePercent: number;
            playerCount: number | null;
            diskUsage: number | null;
            serverOnline: boolean;
          }) => ({
            timestamp: new Date(m.timestamp).toLocaleString(),
            cpuUsage: m.cpuUsage,
            memoryUsagePercent: m.memoryUsagePercent,
            playerCount: m.playerCount,
            diskUsage: m.diskUsage || 0,
            serverOnline: m.serverOnline || false,
          })));
        } else {
          setMetricsData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching historical metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      <Head>
        <title>All Stats - SMP Admin Panel</title>
        <meta name="description" content="Detailed server statistics and monitoring" />
      </Head>

      <div className="min-h-screen bg-stone-900 text-stone-100">
        {/* Header */}
        <header className="bg-stone-800 border-b-4 border-stone-700 py-4">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-green-400 hover:text-green-300 transition-colors">
                  <span className="text-2xl">🎮</span>
                </Link>
                <h1 className="text-2xl font-bold text-green-400">Detailed Statistics</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-stone-300">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-green-400 hover:text-green-300 transition-colors inline-flex items-center"
            >
              <span className="mr-2">←</span> Back to Dashboard
            </Link>
          </div>

          {/* Time Range Selector */}
          <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Time Range</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <button
                onClick={() => setTimeRange('24h')}
                className={`px-6 py-2 rounded transition-colors ${
                  timeRange === '24h'
                    ? 'bg-green-600 text-white'
                    : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                }`}
              >
                Last 24 Hours
              </button>
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-6 py-2 rounded transition-colors ${
                  timeRange === '7d'
                    ? 'bg-green-600 text-white'
                    : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-6 py-2 rounded transition-colors ${
                  timeRange === '30d'
                    ? 'bg-green-600 text-white'
                    : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTimeRange('custom')}
                className={`px-6 py-2 rounded transition-colors ${
                  timeRange === 'custom'
                    ? 'bg-green-600 text-white'
                    : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                }`}
              >
                Custom Range
              </button>
            </div>
            
            {/* Custom Date Range Picker */}
            {timeRange === 'custom' && (
              <div className="flex flex-wrap gap-4 items-end mt-4 p-4 bg-stone-900 rounded">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-stone-300 mb-2 text-sm">Start Date</label>
                  <input
                    type="datetime-local"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-700 text-stone-100 rounded border border-stone-600 focus:border-green-400 focus:outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-stone-300 mb-2 text-sm">End Date</label>
                  <input
                    type="datetime-local"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-700 text-stone-100 rounded border border-stone-600 focus:border-green-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={fetchHistoricalMetrics}
                  disabled={!customStartDate || !customEndDate}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
            
            {/* Auto-Refresh Controls */}
            <div className="flex flex-wrap gap-4 items-center mt-4 pt-4 border-t border-stone-700">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 accent-green-600"
                />
                <label htmlFor="autoRefresh" className="text-stone-300">
                  Auto-refresh
                </label>
              </div>
              {autoRefresh && (
                <div className="flex items-center gap-2">
                  <label className="text-stone-300 text-sm">Interval:</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value) as 10 | 30)}
                    className="px-3 py-1 bg-stone-700 text-stone-100 rounded border border-stone-600 focus:border-green-400 focus:outline-none"
                  >
                    <option value={10}>10 seconds</option>
                    <option value={30}>30 seconds</option>
                  </select>
                </div>
              )}
              <button
                onClick={fetchHistoricalMetrics}
                className="px-4 py-1 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded transition-colors text-sm"
              >
                🔄 Refresh Now
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner />
            </div>
          ) : metricsData.length === 0 ? (
            <div className="bg-stone-800 border-4 border-stone-700 p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-green-400 mb-4">No Historical Data Yet</h2>
              <p className="text-stone-300 mb-4">
                Start collecting real-time server metrics to view historical trends.
              </p>
              <div className="text-stone-400 text-sm space-y-2">
                <p>
                  To begin collecting data, call the metrics API with the{' '}
                  <code className="bg-stone-900 px-2 py-1 rounded">?saveHistory=true</code>{' '}
                  parameter (requires authentication):
                </p>
                <code className="bg-stone-900 px-3 py-2 rounded block text-xs text-left max-w-2xl mx-auto overflow-x-auto">
                  curl http://localhost:3000/apanel44/api/monitoring/metrics?saveHistory=true
                </code>
                <p className="pt-2">
                  For complete setup instructions including authentication, see{' '}
                  <span className="text-green-400">TESTING_DEPLOYMENT_GUIDE.md</span>.
                </p>
                <p className="text-xs text-stone-500 pt-2">
                  Metrics include: CPU usage, memory usage, database stats, and real Minecraft player counts
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* CPU Usage Chart */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">CPU Usage Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e', fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e' }}
                      domain={[0, 100]}
                      label={{ value: 'CPU Usage (%)', angle: -90, position: 'insideLeft', fill: '#a8a29e' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#292524', border: '2px solid #44403c', borderRadius: '4px' }}
                      labelStyle={{ color: '#4ade80' }}
                    />
                    <Legend wrapperStyle={{ color: '#a8a29e' }} />
                    <Line 
                      type="monotone" 
                      dataKey="cpuUsage" 
                      stroke="#4ade80" 
                      strokeWidth={2}
                      name="CPU Usage (%)"
                      dot={{ fill: '#4ade80' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Memory Usage Chart */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">Memory Usage Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e', fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e' }}
                      domain={[0, 100]}
                      label={{ value: 'Memory Usage (%)', angle: -90, position: 'insideLeft', fill: '#a8a29e' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#292524', border: '2px solid #44403c', borderRadius: '4px' }}
                      labelStyle={{ color: '#4ade80' }}
                    />
                    <Legend wrapperStyle={{ color: '#a8a29e' }} />
                    <Line 
                      type="monotone" 
                      dataKey="memoryUsagePercent" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Memory Usage (%)"
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Player Count Chart */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">Player Count Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e', fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e' }}
                      label={{ value: 'Players Online', angle: -90, position: 'insideLeft', fill: '#a8a29e' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#292524', border: '2px solid #44403c', borderRadius: '4px' }}
                      labelStyle={{ color: '#4ade80' }}
                    />
                    <Legend wrapperStyle={{ color: '#a8a29e' }} />
                    <Line 
                      type="monotone" 
                      dataKey="playerCount" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Players Online"
                      dot={{ fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Disk Usage Chart */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">Disk Usage Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e', fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e' }}
                      domain={[0, 100]}
                      label={{ value: 'Disk Usage (%)', angle: -90, position: 'insideLeft', fill: '#a8a29e' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#292524', border: '2px solid #44403c', borderRadius: '4px' }}
                      labelStyle={{ color: '#4ade80' }}
                    />
                    <Legend wrapperStyle={{ color: '#a8a29e' }} />
                    <Area 
                      type="monotone" 
                      dataKey="diskUsage" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      name="Disk Usage (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Server Status History */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">Server Status History</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e', fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#a8a29e"
                      tick={{ fill: '#a8a29e' }}
                      domain={[0, 1]}
                      ticks={[0, 1]}
                      tickFormatter={(value) => value === 1 ? 'Online' : 'Offline'}
                      label={{ value: 'Server Status', angle: -90, position: 'insideLeft', fill: '#a8a29e' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#292524', border: '2px solid #44403c', borderRadius: '4px' }}
                      labelStyle={{ color: '#4ade80' }}
                      formatter={(value: number | undefined) => [value === 1 ? 'Online' : 'Offline', 'Status']}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#a8a29e' }}
                      formatter={() => 'Server Status'}
                    />
                    <Bar 
                      dataKey="serverOnline" 
                      name="Server Status"
                    >
                      {metricsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.serverOnline ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-stone-300">Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-stone-300">Offline</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Redirect to login if not authenticated
  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Only allow Admin and Super Admin roles
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== 'Super Admin' && userRole !== 'Admin') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: (session.user as { id?: string }).id || '',
        email: session.user.email || '',
        name: session.user.name || 'User',
        role: userRole || '',
      },
    },
  };
};
