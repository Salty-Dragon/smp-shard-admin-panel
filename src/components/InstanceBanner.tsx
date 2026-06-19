/**
 * Instance Banner Component
 *
 * Persistent banner showing the currently selected server instance.
 * Displayed on every authenticated page below the nav bar.
 * Provides a dropdown to switch instances when multiple are configured.
 */

import { Server } from 'lucide-react';
import { useInstance } from '@/contexts/InstanceContext';

export default function InstanceBanner() {
  const { currentInstance, setCurrentInstance, instances, loading } = useInstance();

  if (loading) {
    return (
      <div className="glass border-b border-green-500/10">
        <div className="container mx-auto px-4 py-2">
          <span className="text-gray-500 text-sm">Loading instance…</span>
        </div>
      </div>
    );
  }

  const currentInstanceData = instances.find((i) => i.id === currentInstance);
  const dot = currentInstanceData?.isDefault ? 'bg-green-400' : 'bg-blue-400';

  return (
    <div className="glass border-b border-green-500/10">
      <div className="container mx-auto px-4 py-2 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 text-gray-400 text-sm font-semibold">
          <Server className="h-4 w-4 text-green-400" />
          Managing:
        </span>

        {instances.length <= 1 ? (
          /* Single instance — show badge only, no dropdown */
          <span className="inline-flex items-center gap-2 rounded-lg bg-black/30 border border-green-500/20 px-3 py-1 text-sm font-mono">
            <span className={`w-2 h-2 rounded-full animate-pulse ${dot}`} />
            <span className="text-green-400 font-semibold">
              {currentInstanceData?.displayName ?? currentInstance ?? '—'}
            </span>
            {currentInstanceData?.name && currentInstanceData.name !== currentInstanceData.displayName && (
              <span className="text-gray-500">({currentInstanceData.name})</span>
            )}
            {currentInstanceData?.description && (
              <span className="text-gray-400 hidden sm:inline">— {currentInstanceData.description}</span>
            )}
          </span>
        ) : (
          /* Multiple instances — show dropdown to switch */
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${dot}`} />
            <select
              value={currentInstance ?? ''}
              onChange={(e) => setCurrentInstance(e.target.value)}
              className="rounded-lg bg-black/40 border border-green-500/20 text-green-400 font-mono text-sm px-3 py-1 focus:outline-none focus:border-green-500/60 cursor-pointer"
              aria-label="Switch server instance"
            >
              {instances.map((instance) => (
                <option key={instance.id} value={instance.id} className="text-white bg-stone-900">
                  {instance.displayName}
                  {instance.description ? ` — ${instance.description}` : ''}
                </option>
              ))}
            </select>
            {currentInstanceData?.name && currentInstanceData.name !== currentInstanceData.displayName && (
              <span className="text-gray-500 text-sm font-mono hidden sm:inline">
                ({currentInstanceData.name})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
