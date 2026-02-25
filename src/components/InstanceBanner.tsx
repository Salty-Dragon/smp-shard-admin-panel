/**
 * Instance Banner Component
 *
 * Persistent banner showing the currently selected server instance.
 * Displayed on every authenticated page below the nav bar.
 * Provides a dropdown to switch instances when multiple are configured.
 */

import { useInstance } from '@/contexts/InstanceContext';

export default function InstanceBanner() {
  const { currentInstance, setCurrentInstance, instances, loading } = useInstance();

  if (loading) {
    return (
      <div className="bg-stone-800/40 border-b border-stone-700">
        <div className="container mx-auto px-4 py-2">
          <span className="text-stone-500 text-sm">Loading instance...</span>
        </div>
      </div>
    );
  }

  const currentInstanceData = instances.find(i => i.id === currentInstance);

  return (
    <div className="bg-stone-800/40 border-b border-stone-700">
      <div className="container mx-auto px-4 py-2 flex items-center gap-3">
        <span className="text-stone-400 text-sm font-semibold">⛏️ Managing:</span>

        {instances.length <= 1 ? (
          /* Single instance — show badge only, no dropdown */
          <span className="inline-flex items-center gap-2 bg-stone-900 border border-stone-600 px-3 py-1 text-sm font-mono">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                currentInstanceData?.isDefault ? 'bg-green-400' : 'bg-blue-400'
              }`}
            />
            <span className="text-green-400 font-semibold">
              {currentInstanceData?.displayName ?? currentInstance ?? '—'}
            </span>
            {currentInstanceData?.name && currentInstanceData.name !== currentInstanceData.displayName && (
              <span className="text-stone-500">({currentInstanceData.name})</span>
            )}
            {currentInstanceData?.description && (
              <span className="text-stone-400 hidden sm:inline">— {currentInstanceData.description}</span>
            )}
          </span>
        ) : (
          /* Multiple instances — show dropdown to switch */
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${
                currentInstanceData?.isDefault ? 'bg-green-400' : 'bg-blue-400'
              }`}
            />
            <select
              value={currentInstance ?? ''}
              onChange={(e) => setCurrentInstance(e.target.value)}
              className="bg-stone-900 border border-stone-600 text-green-400 font-mono text-sm px-3 py-1 focus:outline-none focus:border-green-500 cursor-pointer"
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
              <span className="text-stone-500 text-sm font-mono hidden sm:inline">
                ({currentInstanceData.name})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
