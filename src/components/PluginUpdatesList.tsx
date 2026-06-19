/**
 * Plugin Updates List Component
 * Displays all plugins with update information and allows updating
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, AlertTriangle, PackageCheck } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';
import Button from './Button';
import { cn } from '@/lib/cn';

interface PluginInfo {
  name: string;
  filename: string;
  version: string;
  apiVersion?: string;
  website?: string;
  description?: string;
  latestVersion?: string;
  updateAvailable: boolean;
  downloadUrl?: string;
  updateSource?: 'hangar' | 'modrinth' | 'spiget' | 'manual' | 'none';
}

interface PluginUpdatesData {
  total: number;
  updatesAvailable: number;
  plugins: PluginInfo[];
}

export default function PluginUpdatesList() {
  const [data, setData] = useState<PluginUpdatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPlugin, setUpdatingPlugin] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginInfo | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{ plugin: string; message: string; success: boolean } | null>(null);

  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/apanel44/api/plugins/updates');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch plugins' }));
        throw new Error(errorData.message || 'Failed to fetch plugin updates');
      }

      const pluginData = await response.json();
      setData(pluginData);
    } catch (err) {
      console.error('Error fetching plugin updates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch plugin updates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleUpdateClick = (plugin: PluginInfo) => {
    setSelectedPlugin(plugin);
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedPlugin || !selectedPlugin.downloadUrl) return;

    setShowConfirmModal(false);
    setUpdatingPlugin(selectedPlugin.filename);
    setUpdateMessage(null);

    try {
      const response = await fetch('/apanel44/api/plugins/deploy-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pluginFilename: selectedPlugin.filename,
          downloadUrl: selectedPlugin.downloadUrl,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update plugin');
      }

      setUpdateMessage({
        plugin: selectedPlugin.filename,
        message: `Successfully updated to ${selectedPlugin.latestVersion}`,
        success: true,
      });

      // Refresh plugin list after successful update
      setTimeout(fetchPlugins, 2000);
    } catch (err) {
      console.error('Error updating plugin:', err);
      setUpdateMessage({
        plugin: selectedPlugin.filename,
        message: err instanceof Error ? err.message : 'Update failed',
        success: false,
      });
    } finally {
      setUpdatingPlugin(null);
      setSelectedPlugin(null);
    }
  };

  const getSourceBadge = (source?: string) => {
    const badges = {
      hangar: { color: 'bg-blue-500/10 border-blue-500/30 text-blue-300', label: 'Hangar' },
      modrinth: { color: 'bg-green-500/10 border-green-500/30 text-green-400', label: 'Modrinth' },
      spiget: { color: 'bg-orange-500/10 border-orange-500/30 text-orange-300', label: 'Spiget' },
      manual: { color: 'bg-purple-500/10 border-purple-500/30 text-purple-300', label: 'Manual' },
      none: { color: 'bg-white/5 border-white/10 text-gray-400', label: 'Unknown' },
    };

    const badge = badges[source as keyof typeof badges] || badges.none;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs border rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading && !data) {
    return (
      <div className="glass rounded-2xl border border-green-500/20 p-6">
        <Spinner size="medium" message="Checking for plugin updates…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl border border-red-500/20 p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Plugins</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Button variant="secondary" onClick={fetchPlugins} className="mx-auto">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="glass rounded-2xl border border-green-500/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-green-500/10">
          <div>
            <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
              <PackageCheck className="h-5 w-5" /> Plugin Updates
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {data.updatesAvailable > 0
                ? `${data.updatesAvailable} update${data.updatesAvailable !== 1 ? 's' : ''} available`
                : 'All plugins are up to date'}
            </p>
          </div>
          <button
            onClick={fetchPlugins}
            disabled={loading}
            className="text-gray-400 hover:text-green-400 rounded-lg p-2 hover:bg-white/5 transition-colors disabled:opacity-50"
            aria-label="Refresh plugin updates"
          >
            <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Update Message */}
        {updateMessage && (
          <div
            className={cn(
              'p-4 border-b border-green-500/10',
              updateMessage.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-300'
            )}
          >
            <div className="font-semibold">{updateMessage.plugin}</div>
            <div className="text-sm">{updateMessage.message}</div>
          </div>
        )}

        {/* Plugins List */}
        <div className="divide-y divide-white/5">
          {data.plugins.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No plugins found</div>
          ) : (
            data.plugins.map((plugin) => (
              <div key={plugin.filename} className="p-4 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Plugin Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="text-white font-semibold truncate">{plugin.name}</h4>
                      {plugin.updateAvailable && (
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 text-xs bg-green-500/10 border border-green-500/30 text-green-400 rounded-full">
                          Update Available
                        </span>
                      )}
                      {getSourceBadge(plugin.updateSource)}
                    </div>

                    {plugin.description && (
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">{plugin.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div>
                        <span className="text-gray-500">Current:</span>{' '}
                        <span className="text-white font-mono">{plugin.version}</span>
                      </div>

                      {plugin.updateAvailable && plugin.latestVersion && (
                        <div>
                          <span className="text-gray-500">Latest:</span>{' '}
                          <span className="text-green-400 font-mono">{plugin.latestVersion}</span>
                        </div>
                      )}

                      {plugin.apiVersion && (
                        <div>
                          <span className="text-gray-500">API:</span>{' '}
                          <span className="text-gray-400 font-mono">{plugin.apiVersion}</span>
                        </div>
                      )}
                    </div>

                    {plugin.website && (
                      <a
                        href={plugin.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400/80 hover:text-green-400 text-sm inline-flex items-center gap-1 mt-2"
                      >
                        Visit website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {/* Update Button */}
                  <div className="flex-shrink-0">
                    {plugin.updateAvailable && plugin.downloadUrl ? (
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateClick(plugin)}
                        disabled={updatingPlugin === plugin.filename}
                        className="px-4 py-2 text-sm"
                      >
                        {updatingPlugin === plugin.filename ? 'Updating…' : 'Update'}
                      </Button>
                    ) : plugin.updateAvailable ? (
                      <div className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-sm cursor-not-allowed">
                        Manual Update Required
                      </div>
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">Up to date</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedPlugin && (
        <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Plugin Update" size="small">
          <div className="text-gray-200 mb-6">
            <p className="mb-4">
              Are you sure you want to update <strong className="text-white">{selectedPlugin.name}</strong>?
            </p>
            <div className="bg-black/30 border border-white/5 p-4 rounded-xl mb-4 space-y-2">
              <div>
                <span className="text-gray-500">Current version:</span>{' '}
                <span className="text-white font-mono">{selectedPlugin.version}</span>
              </div>
              <div>
                <span className="text-gray-500">New version:</span>{' '}
                <span className="text-green-400 font-mono">{selectedPlugin.latestVersion}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Source:</span>
                {getSourceBadge(selectedPlugin.updateSource)}
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl mb-4">
              <p className="text-yellow-300 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> The server will be stopped and restarted during the update.
                  Players will be disconnected. The update will be rolled back automatically if the server
                  fails to start.
                </span>
              </p>
            </div>
            <p className="text-gray-500 text-sm">This process may take 1-2 minutes to complete.</p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmUpdate} className="flex-1">
              Update Plugin
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
