/**
 * Error Report Modal Component
 * Modal for submitting error reports
 */

import { useState } from 'react';
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
    <Modal isOpen={isOpen} onClose={onClose} title="🐛 Submit Error Report" size="medium">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/50 border-2 border-red-700 p-3 text-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div>
          <label className="block text-green-400 font-semibold mb-2 text-sm">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2 focus:border-green-500 focus:outline-none"
            placeholder="Brief description of the issue"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-green-400 font-semibold mb-2 text-sm">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2 focus:border-green-500 focus:outline-none"
            placeholder="Detailed description of what happened..."
            rows={6}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-green-400 font-semibold mb-2 text-sm">
            Severity *
          </label>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2 focus:border-green-500 focus:outline-none"
            disabled={loading}
          >
            <option value="low">Low - Minor issue</option>
            <option value="medium">Medium - Normal issue</option>
            <option value="high">High - Important issue</option>
            <option value="critical">Critical - Urgent issue</option>
          </select>
        </div>

        <div>
          <label className="block text-green-400 font-semibold mb-2 text-sm">
            Page (optional)
          </label>
          <input
            type="text"
            value={formData.page}
            onChange={(e) => setFormData({ ...formData, page: e.target.value })}
            className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2 focus:border-green-500 focus:outline-none"
            placeholder="e.g., /dashboard or leave blank for current page"
            disabled={loading}
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 border-b-4 border-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-6 bg-stone-700 hover:bg-stone-600 text-white font-bold py-3 border-b-4 border-stone-800"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
