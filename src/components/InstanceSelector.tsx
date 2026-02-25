/**
 * Server Instance Selector Component
 * 
 * Allows users to switch between different Minecraft server instances
 * Displays current instance with clear visual indicator
 */

import { useState, useEffect } from 'react';

interface ServerInstance {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isDefault?: boolean;
}

interface InstanceSelectorProps {
  onInstanceChange?: (instanceId: string) => void;
  currentInstance?: string;
  className?: string;
}

export default function InstanceSelector({ 
  onInstanceChange, 
  currentInstance,
  className = '' 
}: InstanceSelectorProps) {
  const [instances, setInstances] = useState<ServerInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInstances();
  }, []);

  useEffect(() => {
    if (currentInstance) {
      setSelectedInstance(currentInstance);
    }
  }, [currentInstance]);

  const fetchInstances = async () => {
    try {
      const response = await fetch('/apanel44/api/instances');
      if (response.ok) {
        const data = await response.json();
        setInstances(data.instances);
        
        // Set default instance if not already set
        if (!selectedInstance && data.defaultInstanceId) {
          setSelectedInstance(data.defaultInstanceId);
          if (onInstanceChange) {
            onInstanceChange(data.defaultInstanceId);
          }
        }
      } else {
        setError('Failed to load server instances');
      }
    } catch (err) {
      console.error('Error fetching instances:', err);
      setError('Failed to load server instances');
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceChange = (instanceId: string) => {
    setSelectedInstance(instanceId);
    if (onInstanceChange) {
      onInstanceChange(instanceId);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500">Loading instances...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

  // If only one instance, show it as a badge without dropdown
  if (instances.length === 1) {
    const instance = instances[0];
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm font-medium text-gray-700">Server Instance:</span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {instance.displayName}
        </span>
      </div>
    );
  }

  // Multiple instances - show dropdown
  const currentInstanceData = instances.find(i => i.id === selectedInstance);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="instance-selector" className="text-sm font-medium text-gray-700">
        Server Instance:
      </label>
      <div className="relative">
        <select
          id="instance-selector"
          value={selectedInstance}
          onChange={(e) => handleInstanceChange(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          aria-label="Select server instance"
        >
          {instances.map((instance) => (
            <option key={instance.id} value={instance.id}>
              {instance.displayName}
              {instance.description ? ` - ${instance.description}` : ''}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      
      {/* Visual indicator badge */}
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${
          currentInstanceData?.isDefault ? 'bg-green-500' : 'bg-blue-500'
        } animate-pulse`}></div>
        <span className="text-xs text-gray-500">
          {currentInstanceData?.isDefault ? 'Default' : 'Active'}
        </span>
      </div>
    </div>
  );
}
