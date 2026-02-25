/**
 * Scheduled Tasks Management Page
 * Super Admin and Admin - view and manage scheduled tasks
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Spinner from '@/components/Spinner';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import InstanceBanner from '@/components/InstanceBanner';
import { useInstance } from '@/contexts/InstanceContext';

interface ScheduledTask {
  id: string;
  name: string;
  description: string | null;
  taskType: string;
  scheduleType: string;
  scheduledFor: string | null;
  cronExpression: string | null;
  status: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
    role: {
      name: string;
    };
  };
}

interface ScheduledTasksPageProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface TaskFormData {
  name: string;
  description: string;
  taskType: string;
  scheduleType: string;
  scheduledFor: string;
  cronExpression: string;
  status: string;
}

export default function ScheduledTasksPage({ user }: ScheduledTasksPageProps) {
  const { currentInstance } = useInstance();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    taskType: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    taskType: 'backup',
    scheduleType: 'once',
    scheduledFor: '',
    cronExpression: '',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentInstance]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.taskType) params.append('taskType', filters.taskType);
      if (currentInstance) params.append('instanceId', currentInstance);

      const response = await fetch(`/apanel44/api/scheduled-tasks?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        setToast({ message: 'Failed to fetch scheduled tasks', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching scheduled tasks:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task?: ScheduledTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.name,
        description: task.description || '',
        taskType: task.taskType,
        scheduleType: task.scheduleType,
        scheduledFor: task.scheduledFor ? new Date(task.scheduledFor).toISOString().slice(0, 16) : '',
        cronExpression: task.cronExpression || '',
        status: task.status,
      });
    } else {
      setEditingTask(null);
      setFormData({
        name: '',
        description: '',
        taskType: 'backup',
        scheduleType: 'once',
        scheduledFor: '',
        cronExpression: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingTask 
        ? `/apanel44/api/scheduled-tasks/${editingTask.id}`
        : '/apanel44/api/scheduled-tasks';
      
      const method = editingTask ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || null,
        scheduleType: formData.scheduleType,
        status: formData.status,
      };

      if (currentInstance) {
        body.instanceId = currentInstance;
      }

      if (!editingTask) {
        body.taskType = formData.taskType;
      }

      if (formData.scheduleType === 'once') {
        body.scheduledFor = formData.scheduledFor ? new Date(formData.scheduledFor).toISOString() : null;
        body.cronExpression = null;
      } else {
        body.cronExpression = formData.cronExpression;
        body.scheduledFor = null;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setToast({ 
          message: editingTask ? 'Task updated successfully' : 'Task created successfully', 
          type: 'success' 
        });
        handleCloseModal();
        fetchTasks();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Failed to save task', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/apanel44/api/scheduled-tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setToast({ message: 'Task deleted successfully', type: 'success' });
        fetchTasks();
      } else {
        setToast({ message: 'Failed to delete task', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    }
  };

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case 'backup': return 'text-blue-400';
      case 'cleanup': return 'text-yellow-400';
      case 'ban': return 'text-red-400';
      case 'unban': return 'text-green-400';
      case 'custom': return 'text-purple-400';
      default: return 'text-stone-400';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'backup': return '💾';
      case 'cleanup': return '🧹';
      case 'ban': return '🔨';
      case 'unban': return '✅';
      case 'custom': return '⚙️';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'completed': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-stone-400';
    }
  };

  return (
    <>
      <Head>
        <title>Scheduled Tasks - SMP Admin Panel</title>
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
                <p className="text-stone-400 text-sm">Scheduled Tasks Management</p>
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

        {/* Instance Banner */}
        <InstanceBanner />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-stone-800 border-4 border-stone-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">
                ⏰ Scheduled Tasks
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 border-b-4 border-blue-800"
                >
                  + Create Task
                </button>
                <button
                  onClick={fetchTasks}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 border-b-4 border-green-800"
                >
                  ↻ Refresh
                </button>
              </div>
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
                  className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-green-400 font-semibold mb-2 text-sm">
                  Task Type
                </label>
                <select
                  value={filters.taskType}
                  onChange={(e) => setFilters({ ...filters, taskType: e.target.value })}
                  className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                >
                  <option value="">All Types</option>
                  <option value="backup">Backup</option>
                  <option value="cleanup">Cleanup</option>
                  <option value="ban">Ban</option>
                  <option value="unban">Unban</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-green-400 font-semibold mb-2 text-sm">
                  Showing
                </label>
                <div className="bg-stone-900 border-2 border-stone-700 px-4 py-2 text-white">
                  {tasks.length} tasks
                </div>
              </div>
            </div>

            {/* Tasks List */}
            {loading ? (
              <div className="text-center py-12">
                <Spinner size="large" message="Loading scheduled tasks..." />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                No scheduled tasks found
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-stone-900 border-2 border-stone-700 p-4 hover:border-green-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <span className="text-3xl">{getTaskTypeIcon(task.taskType)}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-white font-bold text-lg">{task.name}</h3>
                            <span className={`text-xs uppercase font-semibold ${getTaskTypeColor(task.taskType)}`}>
                              {task.taskType}
                            </span>
                            <span className={`text-xs uppercase font-semibold ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-stone-300 text-sm mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-stone-500">
                            <span>Type: {task.scheduleType}</span>
                            {task.scheduleType === 'recurring' && task.cronExpression && (
                              <>
                                <span>•</span>
                                <span>Cron: {task.cronExpression}</span>
                              </>
                            )}
                            {task.nextRunAt && (
                              <>
                                <span>•</span>
                                <span>Next: {new Date(task.nextRunAt).toLocaleString()}</span>
                              </>
                            )}
                            {task.lastRunAt && (
                              <>
                                <span>•</span>
                                <span>Last: {new Date(task.lastRunAt).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => handleOpenModal(task)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 border-b-4 border-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 border-b-4 border-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTask ? '✏️ Edit Task' : '➕ Create Task'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-green-400 font-semibold mb-2 text-sm">
              Task Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
              required
              placeholder="Enter task name..."
            />
          </div>

          <div>
            <label className="block text-green-400 font-semibold mb-2 text-sm">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
              rows={3}
              placeholder="Describe what this task does..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-green-400 font-semibold mb-2 text-sm">
                Task Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                required
                disabled={!!editingTask}
              >
                <option value="backup">Backup</option>
                <option value="cleanup">Cleanup</option>
                <option value="ban">Ban</option>
                <option value="unban">Unban</option>
                <option value="custom">Custom</option>
              </select>
              {editingTask && (
                <p className="text-stone-500 text-xs mt-1">
                  Task type cannot be changed after creation
                </p>
              )}
            </div>

            <div>
              <label className="block text-green-400 font-semibold mb-2 text-sm">
                Schedule Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.scheduleType}
                onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                required
              >
                <option value="once">Once</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
          </div>

          {formData.scheduleType === 'once' ? (
            <div>
              <label className="block text-green-400 font-semibold mb-2 text-sm">
                Scheduled For <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                required={formData.scheduleType === 'once'}
              />
            </div>
          ) : (
            <div>
              <label className="block text-green-400 font-semibold mb-2 text-sm">
                Cron Expression <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
                required={formData.scheduleType === 'recurring'}
                placeholder="0 0 * * *"
              />
              <p className="text-stone-500 text-xs mt-1">
                Examples: &quot;0 0 * * *&quot; (daily at midnight), &quot;0 */6 * * *&quot; (every 6 hours), &quot;0 0 * * 0&quot; (weekly on Sunday)
              </p>
            </div>
          )}

          <div>
            <label className="block text-green-400 font-semibold mb-2 text-sm">
              Status <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
              required
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="bg-stone-600 hover:bg-stone-500 text-white px-6 py-2 border-b-4 border-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 border-b-4 border-green-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

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

  // Only Super Admins and Admins can access scheduled tasks
  if (session.user.role !== 'Super Admin' && session.user.role !== 'Admin') {
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
