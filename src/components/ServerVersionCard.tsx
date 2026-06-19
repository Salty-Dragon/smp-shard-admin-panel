/**
 * Server Version Card Component
 * Displays current PaperMC version and allows updating
 */

import { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { useInstance } from '@/contexts/InstanceContext';

interface ServerVersion {
  currentVersion: string;
  currentBuild: number;
  latestVersion: string;
  latestBuild: number;
  updateAvailable: boolean;
  mcVersion: string;
}

export default function ServerVersionCard() {
  const { currentInstance } = useInstance();
  const [version, setVersion] = useState<ServerVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const fetchVersion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = currentInstance
        ? `/apanel44/api/server/version?instanceId=${encodeURIComponent(currentInstance)}`
        : '/apanel44/api/server/version';
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch version' }));
        throw new Error(errorData.message || 'Failed to fetch server version');
      }

      const data = await response.json();
      setVersion(data);
    } catch (err) {
      console.error('Error fetching server version:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch server version');
    } finally {
      setLoading(false);
    }
  }, [currentInstance]);

  useEffect(() => {
    fetchVersion();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchVersion, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchVersion]);

  const handleUpdateClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!version) return;
    
    setShowConfirmModal(false);
    setUpdating(true);
    setUpdateMessage(null);
    
    try {
      const response = await fetch('/apanel44/api/server/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetBuild: version.latestBuild,
          instanceId: currentInstance || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update server');
      }
      
      setUpdateMessage(`✓ Server updated successfully to build ${version.latestBuild}`);
      
      // Refresh version info after successful update
      setTimeout(fetchVersion, 2000);
    } catch (err) {
      console.error('Error updating server:', err);
      setUpdateMessage(`✗ Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !version) {
    return (
      <div className="bg-stone-800 border-2 border-stone-700 p-6 rounded-lg">
        <Spinner size="small" message="Loading version info..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-800 border-2 border-stone-700 p-6 rounded-lg">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-2">⚠</div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Version</h3>
          <p className="text-stone-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchVersion}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!version) {
    return null;
  }

  return (
    <>
      <div className="bg-stone-800 border-2 border-stone-700 p-6 rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-400">Server Version</h3>
          <button
            onClick={fetchVersion}
            disabled={loading}
            className="text-stone-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Refresh version info"
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
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

        {/* Version Display */}
        <div className="mb-4">
          <div className="text-4xl font-bold text-white mb-2">
            Minecraft {version.mcVersion}
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm text-stone-400">Current Build</div>
              <div className="text-xl font-semibold text-white">#{version.currentBuild}</div>
            </div>
            {version.updateAvailable && (
              <>
                <div className="text-stone-600">→</div>
                <div>
                  <div className="text-sm text-stone-400">Latest Build</div>
                  <div className="text-xl font-semibold text-green-400">#{version.latestBuild}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Update Status */}
        {version.updateAvailable ? (
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700 rounded text-green-400 text-sm">
              <span className="text-lg">🔔</span>
              <span>Update Available</span>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-700/30 border border-stone-600 rounded text-stone-400 text-sm">
              <span className="text-lg">✓</span>
              <span>Up to date</span>
            </div>
          </div>
        )}

        {/* Update Message */}
        {updateMessage && (
          <div className={`mb-4 p-3 rounded border ${
            updateMessage.startsWith('✓')
              ? 'bg-green-900/30 border-green-700 text-green-400'
              : 'bg-red-900/30 border-red-700 text-red-400'
          }`}>
            {updateMessage}
          </div>
        )}

        {/* Update Button */}
        {version.updateAvailable && (
          <button
            onClick={handleUpdateClick}
            disabled={updating}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating Server...' : `Update to Build ${version.latestBuild}`}
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Server Update"
        size="small"
      >
        <div className="text-white mb-6">
          <p className="mb-4">
            Are you sure you want to update the server from build <strong>#{version.currentBuild}</strong> to{' '}
            <strong>#{version.latestBuild}</strong>?
          </p>
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
            Update Server
          </button>
        </div>
      </Modal>
    </>
  );
}
