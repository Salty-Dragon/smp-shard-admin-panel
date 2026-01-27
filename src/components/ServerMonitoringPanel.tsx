/**
 * Server Monitoring Panel Component
 * Displays real-time server metrics
 */

import { useEffect, useState } from 'react';
import Spinner from './Spinner';

interface ServerMetrics {
  cpuUsage: number;
  cpuCount: number;
  memoryTotal: number;
  memoryUsed: number;
  memoryUsagePercent: number;
  dbConnections: number;
  dbQueryTime: number;
  dbStatus: string;
  apiLatency: number;
  apiErrorRate: number;
  apiRequestCount: number;
  uptime: number;
}

export default function ServerMonitoringPanel() {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/apanel44/api/monitoring/metrics');
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setError('');
      } else if (response.status === 403) {
        setError('You do not have permission to view server metrics');
      } else {
        setError('Failed to fetch server metrics');
      }
    } catch (err) {
      setError('An error occurred while fetching metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return 'text-red-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressBarColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-stone-800 border-4 border-stone-700 p-6">
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          🖥️ Server Monitoring
        </h2>
        <div className="py-12">
          <Spinner size="large" message="Loading metrics..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-800 border-4 border-stone-700 p-6">
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          🖥️ Server Monitoring
        </h2>
        <div className="text-center py-8 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="bg-stone-800 border-4 border-stone-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-green-400">
          🖥️ Server Monitoring
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-stone-400 text-sm">Auto-refresh: 10s</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <div className="bg-stone-900 border-2 border-stone-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-400 text-sm font-semibold">CPU Usage</span>
            <span className={`text-xl font-bold ${getStatusColor(metrics.cpuUsage, { warning: 70, danger: 90 })}`}>
              {metrics.cpuUsage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor(metrics.cpuUsage, { warning: 70, danger: 90 })}`}
              style={{ width: `${metrics.cpuUsage}%` }}
            ></div>
          </div>
          <p className="text-stone-500 text-xs mt-2">{metrics.cpuCount} cores</p>
        </div>

        {/* Memory Usage */}
        <div className="bg-stone-900 border-2 border-stone-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-400 text-sm font-semibold">Memory</span>
            <span className={`text-xl font-bold ${getStatusColor(metrics.memoryUsagePercent, { warning: 75, danger: 90 })}`}>
              {metrics.memoryUsagePercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor(metrics.memoryUsagePercent, { warning: 75, danger: 90 })}`}
              style={{ width: `${metrics.memoryUsagePercent}%` }}
            ></div>
          </div>
          <p className="text-stone-500 text-xs mt-2">
            {metrics.memoryUsed.toFixed(2)} / {metrics.memoryTotal.toFixed(2)} GB
          </p>
        </div>

        {/* Database Status */}
        <div className="bg-stone-900 border-2 border-stone-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-400 text-sm font-semibold">Database</span>
            <span className={`text-xl font-bold ${metrics.dbStatus === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.dbStatus === 'healthy' ? '✓' : '✕'}
            </span>
          </div>
          <p className="text-stone-300 text-sm">
            Status: <span className={metrics.dbStatus === 'healthy' ? 'text-green-400' : 'text-red-400'}>
              {metrics.dbStatus}
            </span>
          </p>
          <p className="text-stone-500 text-xs mt-1">
            {metrics.dbConnections} connections
          </p>
          <p className="text-stone-500 text-xs">
            {metrics.dbQueryTime.toFixed(2)}ms query time
          </p>
        </div>

        {/* System Uptime */}
        <div className="bg-stone-900 border-2 border-stone-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-400 text-sm font-semibold">Uptime</span>
            <span className="text-xl font-bold text-green-400">
              {formatUptime(metrics.uptime)}
            </span>
          </div>
          <p className="text-stone-500 text-xs mt-2">
            Server has been running
          </p>
        </div>
      </div>
    </div>
  );
}
