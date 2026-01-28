/**
 * Roles Management Page
 * Super Admin only - view and manage roles
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count?: {
    users: number;
    permissions: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
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

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      <Head>
        <title>Roles Management - SMP Admin Panel</title>
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
                <p className="text-stone-400 text-sm">Roles Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-semibold">{user.name}</p>
                <p className="text-stone-400 text-sm">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 border-b-4 border-red-800 active:border-b-0 active:mt-1 font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-stone-800/50 border-b-2 border-stone-700">
          <div className="container mx-auto px-4">
            <div className="flex space-x-1">
              <Link
                href="/dashboard"
                className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
              >
                📊 Dashboard
              </Link>
              {(user.role === 'Super Admin' || user.role === 'Admin') && (
                <Link
                  href="/users"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  👥 Users
                </Link>
              )}
              {user.role === 'Super Admin' && (
                <Link
                  href="/roles"
                  className="px-6 py-3 text-green-400 font-semibold border-b-4 border-green-500"
                >
                  🛡️ Roles
                </Link>
              )}
              {(user.role === 'Super Admin' || user.role === 'Moderator') && (
                <Link
                  href="/logs"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  📋 Logs
                </Link>
              )}
              {user.role === 'Super Admin' && (
                <Link
                  href="/error-reports"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  🐛 Error Reports
                </Link>
              )}
              {(user.role === 'Super Admin' || user.role === 'Admin') && (
                <Link
                  href="/scheduled-tasks"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  ⏰ Tasks
                </Link>
              )}
              <Link
                href="/2fa-setup"
                className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
              >
                🔐 2FA Setup
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-stone-800 border-4 border-stone-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                🛡️ Roles Management
              </h2>
            </div>

            {error && (
              <div className="bg-red-900 border-2 border-red-700 p-4 mb-4 text-red-200">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-stone-400">
                Loading roles...
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                No roles found
              </div>
            ) : (
              <div className="space-y-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-stone-900 border-2 border-stone-700 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-green-400 mb-2">
                          {role.name}
                        </h3>
                        {role.description && (
                          <p className="text-stone-400 mb-3">
                            {role.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-6 text-sm text-stone-500">
                          <span>
                            Created: {new Date(role.createdAt).toLocaleDateString()}
                          </span>
                          {role._count && (
                            <>
                              <span>Users: {role._count.users}</span>
                              <span>Permissions: {role._count.permissions}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-stone-900 border-2 border-stone-700">
              <p className="text-stone-400 text-sm">
                ℹ️ Note: Role management functionality is currently view-only. 
                Contact your system administrator to modify roles or permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-stone-800 border-t-4 border-stone-700 mt-8">
          <div className="container mx-auto px-4 py-4 text-center">
            <p className="text-stone-400 text-sm">
              SMP Admin Panel | © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
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
