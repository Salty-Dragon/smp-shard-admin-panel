/**
 * Server Instance Context
 * 
 * Provides global state management for the currently selected server instance
 * Used across the application to track which server instance the user is working with
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ServerInstance {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isDefault?: boolean;
}

interface InstanceContextType {
  currentInstance: string | null;
  setCurrentInstance: (instanceId: string) => void;
  instances: ServerInstance[];
  loading: boolean;
  error: string | null;
  refreshInstances: () => Promise<void>;
}

const InstanceContext = createContext<InstanceContextType | undefined>(undefined);

export function useInstance() {
  const context = useContext(InstanceContext);
  if (context === undefined) {
    throw new Error('useInstance must be used within an InstanceProvider');
  }
  return context;
}

interface InstanceProviderProps {
  children: ReactNode;
}

export function InstanceProvider({ children }: InstanceProviderProps) {
  const [currentInstance, setCurrentInstanceState] = useState<string | null>(null);
  const [instances, setInstances] = useState<ServerInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load instances on mount
  useEffect(() => {
    fetchInstances();
  }, []);

  // Load saved instance from localStorage on mount
  useEffect(() => {
    const savedInstance = localStorage.getItem('selectedInstance');
    if (savedInstance && instances.length > 0) {
      const instanceExists = instances.some(i => i.id === savedInstance);
      if (instanceExists) {
        setCurrentInstanceState(savedInstance);
      }
    }
  }, [instances]);

  const fetchInstances = async () => {
    try {
      const response = await fetch('/apanel44/api/instances');
      if (response.ok) {
        const data = await response.json();
        setInstances(data.instances);
        
        // If no current instance, set to default
        if (!currentInstance && data.defaultInstanceId) {
          setCurrentInstanceState(data.defaultInstanceId);
          localStorage.setItem('selectedInstance', data.defaultInstanceId);
        }
        
        setError(null);
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

  const setCurrentInstance = (instanceId: string) => {
    setCurrentInstanceState(instanceId);
    localStorage.setItem('selectedInstance', instanceId);
  };

  const refreshInstances = async () => {
    setLoading(true);
    await fetchInstances();
  };

  const value = {
    currentInstance,
    setCurrentInstance,
    instances,
    loading,
    error,
    refreshInstances,
  };

  return (
    <InstanceContext.Provider value={value}>
      {children}
    </InstanceContext.Provider>
  );
}
