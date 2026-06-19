/**
 * Roles Management Page
 * Super Admin only - view and manage roles
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';

interface Permission {
  id: string;
  resource: string;
  action: string;
}

interface PermissionDefinition {
  resource: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  permissions?: Permission[];
  _count?: {
    users: number;
  };
}

interface RolesPageProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function RolesPage({ user }: RolesPageProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchAvailablePermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/apanel44/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        setError('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Error loading roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await fetch('/apanel44/api/permissions');
      if (response.ok) {
        const data = await response.json();
        setAvailablePermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching available permissions:', error);
    }
  };

  const startEditing = (role: Role) => {
    setEditingRoleId(role.id);
    setError('');
    setSuccess('');
    
    // Create a set of current permission keys for this role
    const permKeys = new Set<string>();
    role.permissions?.forEach(perm => {
      permKeys.add(`${perm.resource}:${perm.action}`);
    });
    setSelectedPermissions(permKeys);
  };

  const cancelEditing = () => {
    setEditingRoleId(null);
    setSelectedPermissions(new Set());
    setError('');
    setSuccess('');
  };

  const togglePermission = (resource: string, action: string) => {
    const key = `${resource}:${action}`;
    const newSelected = new Set(selectedPermissions);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedPermissions(newSelected);
  };

  const savePermissions = async (roleId: string) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Convert selected permissions set to array of objects
      const permissions = Array.from(selectedPermissions).map(key => {
        const [resource, action] = key.split(':');
        return { resource, action };
      });

      const response = await fetch(`/apanel44/api/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        setSuccess('Permissions updated successfully');
        await fetchRoles();
        setEditingRoleId(null);
        setSelectedPermissions(new Set());
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setError('Error updating permissions');
    } finally {
      setSaving(false);
    }
  };

  const canEditRole = (roleName: string) => {
    return roleName === 'Admin' || roleName === 'Moderator';
  };


  return (
    <>
      <Head>
        <title>Roles Management - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AppShell user={user} active="roles">

        {/* Main Content */}
        <div className="space-y-6">
          <div className="glass border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                🛡️ Roles Management
              </h2>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 mb-4 text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 p-4 mb-4 text-green-300">
                {success}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Loading roles...
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No roles found
              </div>
            ) : (
              <div className="space-y-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-black/30 border border-white/10 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-green-400 mb-2">
                          {role.name}
                        </h3>
                        {role.description && (
                          <p className="text-gray-400 mb-3">
                            {role.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>
                            Created: {new Date(role.createdAt).toLocaleDateString()}
                          </span>
                          {role._count && (
                            <span>Users: {role._count.users}</span>
                          )}
                          {role.permissions && (
                            <span>Permissions: {role.permissions.length}</span>
                          )}
                        </div>
                      </div>
                      
                      {canEditRole(role.name) && editingRoleId !== role.id && (
                        <button
                          onClick={() => startEditing(role)}
                          className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
                        >
                          ✏️ Edit Permissions
                        </button>
                      )}
                    </div>

                    {editingRoleId === role.id ? (
                      <div className="mt-4 border-t-2 border-white/10 pt-4">
                        <h4 className="text-lg font-semibold text-green-400 mb-3">
                          Edit Permissions for {role.name}
                        </h4>
                        
                        <div className="space-y-3 mb-4">
                          {availablePermissions.map((perm) => {
                            const permKey = `${perm.resource}:${perm.action}`;
                            const isSelected = selectedPermissions.has(permKey);
                            
                            return (
                              <label
                                key={permKey}
                                className="flex items-start space-x-3 p-3 glass border border-green-500/20 rounded-2xl hover:border-white/10 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePermission(perm.resource, perm.action)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-green-400">
                                    {perm.resource} : {perm.action}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {perm.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => savePermissions(role.id)}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-500 disabled:bg-white/5 text-white px-6 py-2 rounded-xl font-semibold"
                          >
                            {saving ? 'Saving...' : '💾 Save Permissions'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={saving}
                            className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white px-6 py-2 rounded-xl border border-white/10 font-semibold"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 border-t-2 border-white/10 pt-4">
                        <h4 className="text-sm font-semibold text-gray-500 mb-2">
                          Current Permissions:
                        </h4>
                        {role.permissions && role.permissions.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {role.permissions.map((perm) => (
                              <div
                                key={perm.id}
                                className="glass border border-white/10 px-3 py-2 text-sm"
                              >
                                <span className="text-green-400 font-semibold">
                                  {perm.resource}
                                </span>
                                <span className="text-gray-500"> : </span>
                                <span className="text-gray-300">{perm.action}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No permissions assigned</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-black/30 border border-white/10">
              <h3 className="text-xl font-bold text-green-400 mb-4">
                📋 Available Permissions Reference
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Below is a complete list of all available permissions in the system. 
                Super Admin can assign these permissions to Admin and Moderator roles.
              </p>
              
              {availablePermissions.length > 0 ? (
                <div className="space-y-3">
                  {/* Group permissions by resource */}
                  {Object.entries(
                    availablePermissions.reduce((acc, perm) => {
                      if (!acc[perm.resource]) {
                        acc[perm.resource] = [];
                      }
                      acc[perm.resource].push(perm);
                      return acc;
                    }, {} as Record<string, PermissionDefinition[]>)
                  ).map(([resource, perms]) => (
                    <div key={resource} className="glass border border-white/10 p-4">
                      <h4 className="text-lg font-semibold text-green-400 mb-2 capitalize">
                        {resource}
                      </h4>
                      <div className="space-y-2">
                        {perms.map((perm) => (
                          <div key={`${perm.resource}:${perm.action}`} className="flex items-start space-x-3">
                            <span className="text-gray-500 font-mono text-sm bg-black/30 px-2 py-1 border border-white/10 min-w-[80px]">
                              {perm.action}
                            </span>
                            <span className="text-gray-300 text-sm">
                              {perm.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Loading available permissions...</p>
              )}
            </div>

            <div className="mt-4 p-4 bg-black/30 border border-white/10">
              <p className="text-gray-400 text-sm">
                ℹ️ Note: Super Admin role cannot be modified and has all permissions by default. 
                Only Admin and Moderator roles can be edited through this interface.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Only Super Admins can access this page
  if (session.user.role !== 'Super Admin') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };

  return {
    props: {
      user,
    },
  };
};
