/**
 * Plugin Updates List Component
 * Displays all plugins with update information and allows updating
 */

import { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';

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
      hangar: { color: 'bg-blue-900/30 border-blue-700 text-blue-400', label: 'Hangar' },
      modrinth: { color: 'bg-green-900/30 border-green-700 text-green-400', label: 'Modrinth' },
      spiget: { color: 'bg-orange-900/30 border-orange-700 text-orange-400', label: 'Spiget' },
      manual: { color: 'bg-purple-900/30 border-purple-700 text-purple-400', label: 'Manual' },
      none: { color: 'bg-stone-700/30 border-stone-600 text-stone-400', label: 'Unknown' },
    };
    
    const badge = badges[source as keyof typeof badges] || badges.none;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs border rounded ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading && !data) {
    return (
      <div className="bg-stone-800 border-2 border-stone-700 p-6 rounded-lg">
        <Spinner size="medium" message="Checking for plugin updates..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-800 border-2 border-stone-700 p-6 rounded-lg">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-2">⚠</div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Plugins</h3>
          <p className="text-stone-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchPlugins}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="bg-stone-800 border-2 border-stone-700 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-stone-700">
          <div>
            <h3 className="text-lg font-semibold text-green-400">Plugin Updates</h3>
            <p className="text-stone-400 text-sm mt-1">
              {data.updatesAvailable > 0
                ? `${data.updatesAvailable} update${data.updatesAvailable !== 1 ? 's' : ''} available`
                : 'All plugins are up to date'}
            </p>
          </div>
          <button
            onClick={fetchPlugins}
            disabled={loading}
            className="text-stone-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Refresh plugin updates"
          >
            <svg
              className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Update Message */}
        {updateMessage && (
          <div className={`p-4 border-b-2 border-stone-700 ${
            updateMessage.success
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}>
            <div className="font-semibold">{updateMessage.plugin}</div>
            <div className="text-sm">{updateMessage.message}</div>
          </div>
        )}

        {/* Plugins List */}
        <div className="divide-y-2 divide-stone-700">
          {data.plugins.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              No plugins found
            </div>
          ) : (
            data.plugins.map((plugin) => (
              <div key={plugin.filename} className="p-4 hover:bg-stone-700/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Plugin Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold truncate">{plugin.name}</h4>
                      {plugin.updateAvailable && (
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-1 text-xs bg-green-900/30 border border-green-700 text-green-400 rounded">
                          Update Available
                        </span>
                      )}
                      {getSourceBadge(plugin.updateSource)}
                    </div>
                    
                    {plugin.description && (
                      <p className="text-stone-400 text-sm mb-2 line-clamp-2">{plugin.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-stone-500">Current:</span>{' '}
                        <span className="text-white font-mono">{plugin.version}</span>
                      </div>
                      
                      {plugin.updateAvailable && plugin.latestVersion && (
                        <div>
                          <span className="text-stone-500">Latest:</span>{' '}
                          <span className="text-green-400 font-mono">{plugin.latestVersion}</span>
                        </div>
                      )}
                      
                      {plugin.apiVersion && (
                        <div>
                          <span className="text-stone-500">API:</span>{' '}
                          <span className="text-stone-400 font-mono">{plugin.apiVersion}</span>
                        </div>
                      )}
                    </div>
                    
                    {plugin.website && (
                      <a
                        href={plugin.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1 mt-2"
                      >
                        <span>Visit website</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* Update Button */}
                  <div className="flex-shrink-0">
                    {plugin.updateAvailable && plugin.downloadUrl ? (
                      <button
                        onClick={() => handleUpdateClick(plugin)}
                        disabled={updatingPlugin === plugin.filename}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingPlugin === plugin.filename ? 'Updating...' : 'Update'}
                      </button>
                    ) : plugin.updateAvailable ? (
                      <div className="px-4 py-2 bg-stone-700 text-stone-400 text-sm rounded cursor-not-allowed">
                        Manual Update Required
                      </div>
                    ) : (
                      <div className="px-4 py-2 text-stone-500 text-sm">
                        Up to date
                      </div>
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
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirm Plugin Update"
          size="small"
        >
          <div className="text-white mb-6">
            <p className="mb-4">
              Are you sure you want to update <strong>{selectedPlugin.name}</strong>?
            </p>
            <div className="bg-stone-700/50 p-4 rounded mb-4 space-y-2">
              <div>
                <span className="text-stone-400">Current version:</span>{' '}
                <span className="text-white font-mono">{selectedPlugin.version}</span>
              </div>
              <div>
                <span className="text-stone-400">New version:</span>{' '}
                <span className="text-green-400 font-mono">{selectedPlugin.latestVersion}</span>
              </div>
              <div>
                <span className="text-stone-400">Source:</span>{' '}
                {getSourceBadge(selectedPlugin.updateSource)}
              </div>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded mb-4">
              <p className="text-yellow-400 text-sm">
                ⚠ <strong>Warning:</strong> The server will be stopped and restarted during the update.
                Players will be disconnected. The update will be rolled back automatically if the server
                fails to start.
              </p>
            </div>
            <p className="text-stone-400 text-sm">
              This process may take 1-2 minutes to complete.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUpdate}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors"
            >
              Update Plugin
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
