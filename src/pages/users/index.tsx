/**
 * User Management Page
 * Super Admin only - manage users and roles
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
  };
  twoFactorEnabled: boolean;
  twoFactorMethod: string | null;
  createdAt: string;
  lastLogin: string | null;
}

interface Role {
  id: string;
  name: string;
}

interface UsersPageProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function UsersPage({ user }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    roleId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/apanel44/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/apanel44/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/apanel44/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('User created successfully');
        setShowCreateModal(false);
        setFormData({ email: '', password: '', name: '', roleId: '' });
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError('');
    setSuccess('');

    try {
      const updateData: any = {
        name: formData.name,
        roleId: formData.roleId,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSuccess('User updated successfully');
        setEditingUser(null);
        setFormData({ email: '', password: '', name: '', roleId: '' });
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('User deleted successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      roleId: user.role.id,
    });
    setError('');
    setSuccess('');
  };

  return (
    <>
      <Head>
        <title>User Management - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-green-950 to-stone-900">
        {/* Header */}
        <header className="bg-stone-800 border-b-4 border-stone-700 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">⛏️</span>
              <div>
                <h1 className="text-2xl font-bold text-green-400" style={{ 
                  textShadow: '2px 2px 0 rgba(0,0,0,0.8)'
                }}>
                  SMP Admin Panel
                </h1>
                <p className="text-stone-400 text-sm">User Management</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-green-400 hover:text-green-300 font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-stone-800 border-4 border-stone-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                👥 User Management
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setFormData({ email: '', password: '', name: '', roleId: '' });
                  setError('');
                  setSuccess('');
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 border-b-4 border-green-800"
              >
                + Create User
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 bg-red-900/50 border-2 border-red-700 p-4 text-red-200">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-900/50 border-2 border-green-700 p-4 text-green-200">
                ✓ {success}
              </div>
            )}

            {/* Users Table */}
            {loading ? (
              <div className="text-center py-12 text-stone-400">
                Loading users...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-900 border-b-2 border-stone-700">
                      <th className="text-left text-green-400 font-semibold p-4">Name</th>
                      <th className="text-left text-green-400 font-semibold p-4">Email</th>
                      <th className="text-left text-green-400 font-semibold p-4">Role</th>
                      <th className="text-left text-green-400 font-semibold p-4">2FA</th>
                      <th className="text-left text-green-400 font-semibold p-4">Last Login</th>
                      <th className="text-right text-green-400 font-semibold p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-stone-700 hover:bg-stone-900/50">
                        <td className="text-white p-4">{u.name}</td>
                        <td className="text-stone-400 p-4">{u.email}</td>
                        <td className="text-stone-300 p-4">
                          <span className="bg-green-900/50 border border-green-700 px-2 py-1 text-green-400 text-sm">
                            {u.role.name}
                          </span>
                        </td>
                        <td className="text-stone-300 p-4">
                          {u.twoFactorEnabled ? (
                            <span className="text-green-400">
                              ✓ {u.twoFactorMethod === 'totp' ? 'TOTP' : 'Email'}
                            </span>
                          ) : (
                            <span className="text-stone-500">Not enabled</span>
                          )}
                        </td>
                        <td className="text-stone-400 p-4 text-sm">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="text-right p-4">
                          <button
                            onClick={() => openEditModal(u)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 mr-2 text-sm"
                          >
                            Edit
                          </button>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border-4 border-stone-700 p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold text-green-400 mb-4">Create User</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-green-400 font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-green-400 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-green-400 font-semibold mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-green-400 font-semibold mb-2">Role</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-stone-700 hover:bg-stone-600 text-white font-bold py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 border-b-4 border-green-800"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border-4 border-stone-700 p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold text-green-400 mb-4">Edit User</h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-green-400 font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-green-400 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full bg-stone-900 border-2 border-stone-700 text-stone-500 px-4 py-2"
                    disabled
                    autoComplete="email"
                  />
                  <p className="text-stone-500 text-xs mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-green-400 font-semibold mb-2">New Password (optional)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-green-400 font-semibold mb-2">Role</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                    required
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-stone-700 hover:bg-stone-600 text-white font-bold py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 border-b-4 border-green-800"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
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

  // Ensure all user fields are serializable (no undefined values)
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
