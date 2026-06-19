/**
 * User Management Page
 * Super Admin only - manage users and roles
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, Pencil, Trash2, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

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

const inputClass =
  'w-full rounded-xl bg-black/40 border border-green-500/15 text-white px-4 py-2 focus:outline-none focus:border-green-500/50 transition-all';

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
    } catch {
      setError('An error occurred');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError('');
    setSuccess('');

    try {
      const updateData: { name: string; roleId: string; password?: string } = {
        name: formData.name,
        roleId: formData.roleId,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/apanel44/api/users/${editingUser.id}`, {
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
    } catch {
      setError('An error occurred');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/apanel44/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('User deleted successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch {
      setError('An error occurred');
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      password: '',
      name: u.name,
      roleId: u.role.id,
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

      <AppShell user={user} active="users">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-400 text-glow flex items-center gap-2">
              <UsersIcon className="h-6 w-6" /> User Management
            </h2>
            <Button
              variant="primary"
              onClick={() => {
                setShowCreateModal(true);
                setFormData({ email: '', password: '', name: '', roleId: '' });
                setError('');
                setSuccess('');
              }}
            >
              <Plus className="h-4 w-4" /> Create User
            </Button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-green-300">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {success}
            </div>
          )}

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading users…</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full">
                <thead>
                  <tr className="bg-black/30 border-b border-white/10">
                    <th className="text-left text-green-400 font-semibold p-4 text-sm">Name</th>
                    <th className="text-left text-green-400 font-semibold p-4 text-sm">Email</th>
                    <th className="text-left text-green-400 font-semibold p-4 text-sm">Role</th>
                    <th className="text-left text-green-400 font-semibold p-4 text-sm">2FA</th>
                    <th className="text-left text-green-400 font-semibold p-4 text-sm">Last Login</th>
                    <th className="text-right text-green-400 font-semibold p-4 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="text-white p-4">{u.name}</td>
                      <td className="text-gray-400 p-4">{u.email}</td>
                      <td className="p-4">
                        <span className="bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-full text-green-400 text-xs">
                          {u.role.name}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                            <ShieldCheck className="h-4 w-4" /> {u.twoFactorMethod === 'totp' ? 'TOTP' : 'Email'}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Not enabled</span>
                        )}
                      </td>
                      <td className="text-gray-400 p-4 text-sm">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td className="text-right p-4">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 px-2.5 py-1.5 text-xs font-medium transition-all"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 px-2.5 py-1.5 text-xs font-medium transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </AppShell>

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create User" size="small">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-green-400 font-medium mb-2 text-sm">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-green-400 font-medium mb-2 text-sm">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-green-400 font-medium mb-2 text-sm">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={inputClass}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-green-400 font-medium mb-2 text-sm">Role</label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className={inputClass}
              required
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id} className="bg-stone-900 text-white">
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1">
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User" size="small">
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-green-400 font-medium mb-2 text-sm">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-green-400 font-medium mb-2 text-sm">Email</label>
            <input
              type="email"
              value={formData.email}
              className={`${inputClass} text-gray-500`}
              disabled
              autoComplete="email"
            />
            <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-green-400 font-medium mb-2 text-sm">New Password (optional)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-green-400 font-medium mb-2 text-sm">Role</label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className={inputClass}
              required
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id} className="bg-stone-900 text-white">
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setEditingUser(null)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1">
              Update
            </Button>
          </div>
        </form>
      </Modal>
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
