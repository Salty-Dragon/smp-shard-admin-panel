/**
 * Error Reports Management Page
 * Super Admin only - view and manage error reports
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import Spinner from '@/components/Spinner';
import Toast from '@/components/Toast';

interface ErrorReport {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  page: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface ErrorReportsPageProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function ErrorReportsPage({ user }: ErrorReportsPageProps) {
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [filters, setFilters] = useState({
    status: 'open',
    severity: '',
  });
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchErrorReports();
  }, [filters]);

  const fetchErrorReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.severity) params.append('severity', filters.severity);
      params.append('limit', '100');

      const response = await fetch(`/apanel44/api/error-reports?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setErrorReports(data.errorReports);
      } else {
        setToast({ message: 'Failed to fetch error reports', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching error reports:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/apanel44/api/error-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          resolution: newStatus === 'resolved' || newStatus === 'closed' ? resolution : undefined
        }),
      });

      if (response.ok) {
        setToast({ message: 'Error report updated successfully', type: 'success' });
        setSelectedReport(null);
        setResolution('');
        fetchErrorReports();
      } else {
        setToast({ message: 'Failed to update error report', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating error report:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <>
      <Head>
        <title>Error Reports - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AppShell user={user} active="error-reports">

        {/* Main Content */}
        <div className="space-y-6">
          <div className="glass border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">
                🐛 Error Reports
              </h2>
              <button
                onClick={fetchErrorReports}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-xl"
              >
                ↻ Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-green-400 font-semibold mb-2 text-sm">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-green-400 font-semibold mb-2 text-sm">
                  Severity
                </label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-2"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-green-400 font-semibold mb-2 text-sm">
                  Showing
                </label>
                <div className="bg-black/30 border border-white/10 px-4 py-2 text-white">
                  {errorReports.length} reports
                </div>
              </div>
            </div>

            {/* Error Reports List */}
            {loading ? (
              <div className="text-center py-12">
                <Spinner size="large" message="Loading error reports..." />
              </div>
            ) : errorReports.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No error reports found
              </div>
            ) : (
              <div className="space-y-3">
                {errorReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-black/30 border border-white/10 p-4 hover:border-yellow-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <span className="text-3xl">{getSeverityIcon(report.severity)}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-white font-bold text-lg">{report.title}</h3>
                            <span className={`text-xs uppercase font-semibold ${getSeverityColor(report.severity)}`}>
                              {report.severity}
                            </span>
                            <span className="text-xs uppercase font-semibold text-gray-500">
                              {report.status}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{report.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Reported by: {report.user.name}</span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleString()}</span>
                            {report.page && (
                              <>
                                <span>•</span>
                                <span>Page: {report.page}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        {report.status !== 'resolved' && report.status !== 'closed' && (
                          <>
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl"
                            >
                              Update
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Update Form */}
                    {selectedReport?.id === report.id && (
                      <div className="mt-4 pt-4 border-t-2 border-white/10">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-green-400 font-semibold mb-2 text-sm">
                              Update Status
                            </label>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateStatus(report.id, 'in_progress')}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                                disabled={updating}
                              >
                                In Progress
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                                disabled={updating}
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(report.id, 'closed')}
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                                disabled={updating}
                              >
                                Close
                              </button>
                              <button
                                onClick={() => setSelectedReport(null)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-green-400 font-semibold mb-2 text-sm">
                              Resolution Notes (optional)
                            </label>
                            <textarea
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 text-white px-4 py-2"
                              rows={3}
                              placeholder="Describe how the issue was resolved..."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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

  // Only Super Admins can access error reports
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
