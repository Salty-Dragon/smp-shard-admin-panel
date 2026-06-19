/**
 * Error Report Modal Component
 * Modal for submitting error reports
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';

export interface ErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ErrorReportModal({ isOpen, onClose, onSuccess }: ErrorReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    page: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/apanel44/api/error-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          page: formData.page || window.location.pathname,
        }),
      });

      if (response.ok) {
        setFormData({ title: '', description: '', severity: 'medium', page: '' });
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit error report');
      }
    } catch (err) {
      setError('An error occurred while submitting the report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Error Report" size="medium">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div>
          <label className="block text-green-400 font-medium mb-2 text-sm">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-xl bg-black/40 border border-green-500/15 text-white px-4 py-2 focus:outline-none focus:border-green-500/50 transition-all"
            placeholder="Brief description of the issue"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-green-400 font-medium mb-2 text-sm">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-xl bg-black/40 border border-green-500/15 text-white px-4 py-2 focus:outline-none focus:border-green-500/50 transition-all"
            placeholder="Detailed description of what happened..."
            rows={6}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-green-400 font-medium mb-2 text-sm">
            Severity *
          </label>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            className="w-full rounded-xl bg-black/40 border border-green-500/15 text-white px-4 py-2 focus:outline-none focus:border-green-500/50 transition-all"
            disabled={loading}
          >
            <option value="low">Low - Minor issue</option>
            <option value="medium">Medium - Normal issue</option>
            <option value="high">High - Important issue</option>
            <option value="critical">Critical - Urgent issue</option>
          </select>
        </div>

        <div>
          <label className="block text-green-400 font-medium mb-2 text-sm">
            Page (optional)
          </label>
          <input
            type="text"
            value={formData.page}
            onChange={(e) => setFormData({ ...formData, page: e.target.value })}
            className="w-full rounded-xl bg-black/40 border border-green-500/15 text-white px-4 py-2 focus:outline-none focus:border-green-500/50 transition-all"
            placeholder="e.g., /dashboard or leave blank for current page"
            disabled={loading}
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold py-3 transition-all hover:glow-green-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Spinner size="small" />
                <span className="ml-2">Submitting...</span>
              </span>
            ) : (
              'Submit Report'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-medium py-3 transition-all"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
