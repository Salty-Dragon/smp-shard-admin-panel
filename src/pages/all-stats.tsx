/**
 * All Stats Page - Detailed server statistics and monitoring
 * Protected route - requires Admin/Super Admin authentication
 * Shows detailed trends and historical data
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import AppShell from '@/components/AppShell';
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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    try {
      let url = `/apanel44/api/monitoring/history?timeRange=${timeRange}`;
      
      // If custom date range is selected and dates are provided
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        // URL encode the date parameters
        const encodedStart = encodeURIComponent(customStartDate);
        const encodedEnd = encodeURIComponent(customEndDate);
        url = `/apanel44/api/monitoring/history?startDate=${encodedStart}&endDate=${encodedEnd}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch historical metrics');
      }
      
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
    } catch (err) {
      console.error('Error fetching historical metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch historical metrics');
      setMetricsData([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Head>
        <title>All Stats - SMP Admin Panel</title>
        <meta name="description" content="Detailed server statistics and monitoring" />
      </Head>

      <AppShell user={user} active="">

        {/* Main Content */}
        <main className="space-y-6">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-green-400 hover:text-green-300 transition-colors inline-flex items-center"
            >
              <span className="mr-2">←</span> Back to Dashboard
            </Link>
          </div>

          {/* Time Range Selector */}
          <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Time Range</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <button
                onClick={() => setTimeRange('24h')}
                className={`px-6 py-2 rounded transition-colors ${
                  timeRange === '24h'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                Last 24 Hours
              </button>
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-6 py-2 rounded transition-colors ${
                  timeRange === '7d'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-6 py-2 rounded transition-colors ${
                  timeRange === '30d'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTimeRange('custom')}
                className={`px-6 py-2 rounded transition-colors ${
                  timeRange === 'custom'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                Custom Range
              </button>
            </div>
            
            {/* Custom Date Range Picker */}
            {timeRange === 'custom' && (
              <div className="flex flex-wrap gap-4 items-end mt-4 p-4 bg-black/30 rounded">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-gray-300 mb-2 text-sm">Start Date</label>
                  <input
                    type="datetime-local"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 text-gray-200 rounded border border-white/10 focus:border-green-400 focus:outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-gray-300 mb-2 text-sm">End Date</label>
                  <input
                    type="datetime-local"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 text-gray-200 rounded border border-white/10 focus:border-green-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={fetchHistoricalMetrics}
                  disabled={!customStartDate || !customEndDate}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
            
            {/* Auto-Refresh Controls */}
            <div className="flex flex-wrap gap-4 items-center mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 accent-green-600"
                />
                <label htmlFor="autoRefresh" className="text-gray-300">
                  Auto-refresh
                </label>
              </div>
              {autoRefresh && (
                <div className="flex items-center gap-2">
                  <label className="text-gray-300 text-sm">Interval:</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value) as 10 | 30)}
                    className="px-3 py-1 bg-white/5 text-gray-200 rounded border border-white/10 focus:border-green-400 focus:outline-none"
                  >
                    <option value={10}>10 seconds</option>
                    <option value={30}>30 seconds</option>
                  </select>
                </div>
              )}
              <button
                onClick={fetchHistoricalMetrics}
                className="px-4 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors text-sm"
              >
                🔄 Refresh Now
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner />
            </div>
          ) : error ? (
            <div className="glass border-4 border-red-500/30 p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Data</h2>
              <p className="text-gray-300 mb-4">
                {error}
              </p>
              <button
                onClick={fetchHistoricalMetrics}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : metricsData.length === 0 ? (
            <div className="glass border border-green-500/20 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-green-400 mb-4">No Historical Data Yet</h2>
              <p className="text-gray-300 mb-4">
                Start collecting real-time server metrics to view historical trends.
              </p>
              <div className="text-gray-400 text-sm space-y-2">
                <p>
                  To begin collecting data, call the metrics API with the{' '}
                  <code className="bg-black/30 px-2 py-1 rounded">?saveHistory=true</code>{' '}
                  parameter (requires authentication):
                </p>
                <code className="bg-black/30 px-3 py-2 rounded block text-xs text-left max-w-2xl mx-auto overflow-x-auto">
                  curl http://localhost:3000/apanel44/api/monitoring/metrics?saveHistory=true
                </code>
                <p className="pt-2">
                  For complete setup instructions including authentication, see{' '}
                  <span className="text-green-400">TESTING_DEPLOYMENT_GUIDE.md</span>.
                </p>
                <p className="text-xs text-gray-500 pt-2">
                  Metrics include: CPU usage, memory usage, database stats, and real Minecraft player counts
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* CPU Usage Chart */}
              <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
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
              <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
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
              <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
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
              <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
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
              <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
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
                    <span className="text-gray-300">Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-gray-300">Offline</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </AppShell>
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
