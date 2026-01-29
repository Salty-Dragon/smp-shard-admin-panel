/**
 * Metrics Settings Page - Configuration for metrics collection
 * Protected route - requires Super Admin authentication
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Spinner from '@/components/Spinner';

interface MetricsSettingsProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface MetricsSettings {
  metricsEnabled: boolean;
  historyCollectionEnabled: boolean;
  collectionIntervalSeconds: number;
  dataRetentionDays: number;
  aggregationEnabled: boolean;
  aggregationThresholdDays: number;
  aggregationIntervalHours: number;
}

export default function MetricsSettingsPage({ user }: MetricsSettingsProps) {
  const [settings, setSettings] = useState<MetricsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [maintenanceRunning, setMaintenanceRunning] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/apanel44/api/monitoring/settings');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/apanel44/api/monitoring/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRunMaintenance = async () => {
    setMaintenanceRunning(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/apanel44/api/monitoring/maintenance', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to run maintenance');
      }

      const data = await response.json();
      setSuccess(
        `Maintenance completed! Raw metrics processed: ${data.result.aggregatedCount}, Old records deleted: ${data.result.deletedCount}`
      );
    } catch (err) {
      console.error('Error running maintenance:', err);
      setError(err instanceof Error ? err.message : 'Failed to run maintenance');
    } finally {
      setMaintenanceRunning(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const updateSetting = <K extends keyof MetricsSettings>(
    key: K,
    value: MetricsSettings[K]
  ) => {
    if (settings) {
      // Validate numeric inputs
      if (key === 'collectionIntervalSeconds') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 10 || numValue > 3600) {
          setError('Collection interval must be between 10 and 3600 seconds');
          return;
        }
      } else if (key === 'dataRetentionDays') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 365) {
          setError('Data retention must be between 1 and 365 days');
          return;
        }
      } else if (key === 'aggregationThresholdDays') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 90) {
          setError('Aggregation threshold must be between 1 and 90 days');
          return;
        }
      }
      
      setError(null);
      setSettings({ ...settings, [key]: value });
    }
  };

  return (
    <>
      <Head>
        <title>Metrics Settings - SMP Admin Panel</title>
        <meta name="description" content="Configure metrics collection and retention" />
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
                <h1 className="text-2xl font-bold text-green-400">Metrics Settings</h1>
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

          {/* Status Messages */}
          {success && (
            <div className="bg-green-900 border-2 border-green-600 p-4 mb-6 rounded">
              <p className="text-green-100">✅ {success}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border-2 border-red-600 p-4 mb-6 rounded">
              <p className="text-red-100">❌ {error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner />
            </div>
          ) : !settings ? (
            <div className="bg-stone-800 border-4 border-red-700 p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Settings</h2>
              <button
                onClick={fetchSettings}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* General Settings */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">General Metrics Settings</h2>
                
                <div className="space-y-4">
                  {/* Metrics Enabled */}
                  <div className="flex items-center justify-between p-4 bg-stone-900 rounded">
                    <div className="flex-1">
                      <label className="text-lg font-semibold text-stone-100">
                        Enable Metrics Collection
                      </label>
                      <p className="text-sm text-stone-400 mt-1">
                        Master switch for all metrics collection. When disabled, the metrics API will return an error.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={settings.metricsEnabled}
                        onChange={(e) => updateSetting('metricsEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-stone-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* History Collection */}
                  <div className="flex items-center justify-between p-4 bg-stone-900 rounded">
                    <div className="flex-1">
                      <label className="text-lg font-semibold text-stone-100">
                        Enable History Collection
                      </label>
                      <p className="text-sm text-stone-400 mt-1">
                        Automatically save metrics to database for historical tracking and trend analysis.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={settings.historyCollectionEnabled}
                        onChange={(e) => updateSetting('historyCollectionEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-stone-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Collection Interval */}
                  <div className="p-4 bg-stone-900 rounded">
                    <label className="text-lg font-semibold text-stone-100 block mb-2">
                      Collection Interval (seconds)
                    </label>
                    <p className="text-sm text-stone-400 mb-3">
                      How frequently metrics should be collected automatically (10-3600 seconds).
                    </p>
                    <input
                      type="number"
                      min="10"
                      max="3600"
                      value={settings.collectionIntervalSeconds}
                      onChange={(e) => updateSetting('collectionIntervalSeconds', parseInt(e.target.value) || 60)}
                      className="w-full max-w-xs px-4 py-2 bg-stone-700 text-stone-100 rounded border border-stone-600 focus:border-green-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Data Retention Settings */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">Data Retention & Cleanup</h2>
                
                <div className="space-y-4">
                  {/* Retention Days */}
                  <div className="p-4 bg-stone-900 rounded">
                    <label className="text-lg font-semibold text-stone-100 block mb-2">
                      Data Retention Period (days)
                    </label>
                    <p className="text-sm text-stone-400 mb-3">
                      How long to keep raw metrics data before deletion (1-365 days).
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.dataRetentionDays}
                      onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value) || 30)}
                      className="w-full max-w-xs px-4 py-2 bg-stone-700 text-stone-100 rounded border border-stone-600 focus:border-green-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Aggregation Settings */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">Data Aggregation</h2>
                
                <div className="space-y-4">
                  {/* Aggregation Enabled */}
                  <div className="flex items-center justify-between p-4 bg-stone-900 rounded">
                    <div className="flex-1">
                      <label className="text-lg font-semibold text-stone-100">
                        Enable Data Aggregation
                      </label>
                      <p className="text-sm text-stone-400 mt-1">
                        Automatically aggregate old data into hourly summaries to save space and improve performance.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={settings.aggregationEnabled}
                        onChange={(e) => updateSetting('aggregationEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-stone-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Aggregation Threshold */}
                  <div className="p-4 bg-stone-900 rounded">
                    <label className="text-lg font-semibold text-stone-100 block mb-2">
                      Aggregation Threshold (days)
                    </label>
                    <p className="text-sm text-stone-400 mb-3">
                      Aggregate data older than this many days (1-90 days).
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={settings.aggregationThresholdDays}
                      onChange={(e) => updateSetting('aggregationThresholdDays', parseInt(e.target.value) || 7)}
                      className="w-full max-w-xs px-4 py-2 bg-stone-700 text-stone-100 rounded border border-stone-600 focus:border-green-400 focus:outline-none"
                    />
                  </div>

                  {/* Aggregation Interval */}
                  <div className="p-4 bg-stone-900 rounded">
                    <label className="text-lg font-semibold text-stone-100 block mb-2">
                      Aggregation Interval (hours)
                    </label>
                    <p className="text-sm text-stone-400 mb-3">
                      Time bucket size for aggregated data.
                    </p>
                    <select
                      value={settings.aggregationIntervalHours}
                      onChange={(e) => updateSetting('aggregationIntervalHours', parseInt(e.target.value))}
                      className="w-full max-w-xs px-4 py-2 bg-stone-700 text-stone-100 rounded border border-stone-600 focus:border-green-400 focus:outline-none"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={6}>6 Hours</option>
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours (Daily)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">Actions</h2>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
                  >
                    {saving ? 'Saving...' : '💾 Save Settings'}
                  </button>

                  <button
                    onClick={handleRunMaintenance}
                    disabled={maintenanceRunning}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
                  >
                    {maintenanceRunning ? 'Running...' : '🔧 Run Maintenance Now'}
                  </button>

                  <button
                    onClick={fetchSettings}
                    className="px-6 py-3 bg-stone-700 hover:bg-stone-600 text-stone-300 font-semibold rounded transition-colors"
                  >
                    🔄 Reset to Saved
                  </button>
                </div>

                <div className="mt-4 p-4 bg-stone-900 rounded border border-stone-700">
                  <p className="text-sm text-stone-400">
                    <strong className="text-stone-300">Note:</strong> The maintenance task (cleanup and aggregation) 
                    should be run periodically using a cron job or scheduled task. You can also run it manually here 
                    to test the configuration.
                  </p>
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

  // Only allow Super Admin role
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== 'Super Admin') {
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
