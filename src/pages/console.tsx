/**
 * Server Console Page
 * Allows Admins and Super Admins to execute commands on the Minecraft server
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Toast from '@/components/Toast';
import Spinner from '@/components/Spinner';
import { ADMIN_ALLOWED_COMMANDS } from '@/lib/console-constants';

interface ConsolePageProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface CommandHistory {
  id: string;
  user: {
    name: string;
    email: string;
    role: {
      name: string;
    };
  };
  timestamp: string;
  ipAddress: string | null;
  details: {
    command: string;
    status: string;
    reason?: string;
    outputLength?: number;
    error?: string;
  } | null;
}

interface CommandResult {
  success: boolean;
  command: string;
  output: string;
  timestamp: string;
  error?: string;
  message?: string;
}

export default function ConsolePage({ user }: ConsolePageProps) {
  const router = useRouter();
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const [commandOutput, setCommandOutput] = useState<CommandResult[]>([]);
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCommandHistory();
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  // Auto-scroll output to bottom when new output is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [commandOutput]);

  // Command autocomplete
  useEffect(() => {
    if (command.trim()) {
      const baseCommand = command.trim().split(/\s+/)[0].toLowerCase();
      // For Super Admins, include additional commands including start and restart
      const availableCommands = user.role === 'Super Admin' 
        ? [...ADMIN_ALLOWED_COMMANDS, 'start', 'restart', 'stop', 'save-all', 'op', 'deop', 'plugins', 'reload']
        : [...ADMIN_ALLOWED_COMMANDS, 'start', 'restart'];
      
      const filtered = availableCommands.filter(cmd => 
        cmd.startsWith(baseCommand) && cmd !== baseCommand
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [command, user.role]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const fetchCommandHistory = async () => {
    try {
      const response = await fetch('/apanel44/api/server/console?limit=20');
      if (response.ok) {
        const data = await response.json();
        setCommandHistory(data.logs);
      } else {
        setToast({
          message: 'Failed to load command history',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Error fetching command history:', error);
      setToast({
        message: 'Error loading command history',
        type: 'error'
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) {
      return;
    }

    setExecuting(true);
    setShowSuggestions(false);

    try {
      const response = await fetch('/apanel44/api/server/console', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add to output display
        setCommandOutput(prev => [...prev, {
          success: true,
          command: data.command,
          output: data.output,
          timestamp: data.timestamp,
        }]);

        setToast({
          message: 'Command executed successfully',
          type: 'success'
        });

        // Refresh command history
        fetchCommandHistory();
      } else {
        // Show error
        setCommandOutput(prev => [...prev, {
          success: false,
          command: command.trim(),
          output: '',
          timestamp: new Date().toISOString(),
          error: data.message || 'Command failed',
        }]);

        setToast({
          message: data.message || 'Failed to execute command',
          type: 'error'
        });
      }
    } catch (error) {
      setCommandOutput(prev => [...prev, {
        success: false,
        command: command.trim(),
        output: '',
        timestamp: new Date().toISOString(),
        error: 'Network error occurred',
      }]);

      setToast({
        message: 'Network error occurred',
        type: 'error'
      });
    } finally {
      setExecuting(false);
      setCommand('');
      inputRef.current?.focus();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCommand(suggestion + ' ');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const clearOutput = () => {
    setCommandOutput([]);
    setToast({
      message: 'Output cleared',
      type: 'info'
    });
  };

  return (
    <>
      <Head>
        <title>Server Console - SMP Admin Panel</title>
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
                <p className="text-stone-400 text-sm">Server Management System</p>
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
                <>
                  <Link
                    href="/users"
                    className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                  >
                    👥 Users
                  </Link>
                  <Link
                    href="/console"
                    className="px-6 py-3 text-green-400 font-semibold border-b-4 border-green-500"
                  >
                    ⌨️ Console
                  </Link>
                  <Link
                    href="/plugins"
                    className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                  >
                    🔌 Plugins
                  </Link>
                </>
              )}
              {user.role === 'Super Admin' && (
                <Link
                  href="/roles"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
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
              {user.role === 'Super Admin' && (
                <Link
                  href="/metrics-settings"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  ⚙️ Metrics
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Console Output Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info Card */}
              <div className="bg-blue-900/30 border-4 border-blue-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">ℹ️</div>
                  <div>
                    <h3 className="text-blue-300 font-bold mb-2">Command Permissions</h3>
                    <p className="text-blue-200 text-sm mb-2">
                      {user.role === 'Super Admin' 
                        ? 'As a Super Admin, you have access to all commands.'
                        : 'As an Admin, you have access to player management, gameplay, and information commands.'}
                    </p>
                    {user.role !== 'Super Admin' && (
                      <p className="text-blue-200 text-sm">
                        Allowed commands: {[...ADMIN_ALLOWED_COMMANDS].join(', ')}, start, restart
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Card for Special Commands */}
              <div className="bg-green-900/30 border-4 border-green-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔧</div>
                  <div>
                    <h3 className="text-green-300 font-bold mb-2">Special Commands Available</h3>
                    <p className="text-green-200 text-sm mb-2">
                      <code className="bg-green-900/50 px-1">start</code> - Executes ./start.sh to start the server
                    </p>
                    <p className="text-green-200 text-sm mb-2">
                      <code className="bg-green-900/50 px-1">restart</code> - Safely restarts by sending stop command, then executes ./start.sh
                    </p>
                    <p className="text-green-200 text-sm">
                      <code className="bg-green-900/50 px-1">stop</code> - Stops the server (Super Admin only)
                    </p>
                  </div>
                </div>
              </div>

              {/* Command Output */}
              <div className="bg-stone-800 border-4 border-stone-700 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-green-400">Command Output</h2>
                  {commandOutput.length > 0 && (
                    <button
                      onClick={clearOutput}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm border-b-4 border-red-800 active:border-b-0 active:mt-1 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div 
                  ref={outputRef}
                  className="bg-black border-2 border-stone-700 p-4 h-96 overflow-y-auto font-mono text-sm"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {commandOutput.length === 0 ? (
                    <div className="text-stone-500 text-center mt-20">
                      No commands executed yet. Type a command below to get started.
                    </div>
                  ) : (
                    commandOutput.map((result, index) => (
                      <div key={index} className="mb-4">
                        <div className="text-green-400 mb-1">
                          <span className="text-stone-500">&gt;</span> {result.command}
                        </div>
                        {result.success ? (
                          <pre className="text-stone-300 whitespace-pre-wrap ml-4">
                            {result.output || '(No output)'}
                          </pre>
                        ) : (
                          <div className="text-red-400 ml-4">
                            Error: {result.error}
                          </div>
                        )}
                        <div className="text-stone-600 text-xs mt-1 ml-4">
                          {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                  {executing && (
                    <div className="text-yellow-400">
                      <Spinner /> Executing command...
                    </div>
                  )}
                </div>

                {/* Command Input */}
                <form onSubmit={handleCommandSubmit} className="mt-4 relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Enter command (e.g., list, whitelist add player)"
                        disabled={executing}
                        className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2 focus:outline-none focus:border-green-500 disabled:opacity-50 font-mono"
                      />
                      
                      {/* Autocomplete suggestions */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-stone-800 border-2 border-stone-600 mt-1 max-h-40 overflow-y-auto">
                          {suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full text-left px-4 py-2 text-stone-300 hover:bg-stone-700 hover:text-green-400 font-mono text-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={executing || !command.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 border-b-4 border-green-800 active:border-b-0 active:mt-1 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {executing ? 'Executing...' : 'Execute'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Command History Sidebar */}
            <div className="space-y-6">
              <div className="bg-stone-800 border-4 border-stone-700 p-6">
                <h2 className="text-2xl font-bold text-green-400 mb-4">Command History</h2>
                
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <Spinner />
                    <p className="text-stone-400 mt-2">Loading history...</p>
                  </div>
                ) : commandHistory.length === 0 ? (
                  <div className="text-stone-500 text-center py-8 text-sm">
                    No command history available
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {commandHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-stone-900 border-2 p-3 ${
                          item.details?.status === 'executed'
                            ? 'border-green-700'
                            : item.details?.status === 'denied'
                            ? 'border-red-700'
                            : 'border-yellow-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className={`font-mono text-sm ${
                              item.details?.status === 'executed'
                                ? 'text-green-400'
                                : item.details?.status === 'denied'
                                ? 'text-red-400'
                                : 'text-yellow-400'
                            }`}>
                              {item.details?.command || 'Unknown command'}
                            </div>
                            <div className="text-stone-400 text-xs mt-1">
                              by {item.user.name}
                            </div>
                          </div>
                          <div className={`text-xs font-bold px-2 py-1 ${
                            item.details?.status === 'executed'
                              ? 'bg-green-900 text-green-300'
                              : item.details?.status === 'denied'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {item.details?.status || 'unknown'}
                          </div>
                        </div>
                        <div className="text-stone-500 text-xs">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                        {item.details?.reason && (
                          <div className="text-red-400 text-xs mt-2">
                            {item.details.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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

  // Only allow Super Admins and Admins
  if (session.user.role !== 'Super Admin' && session.user.role !== 'Admin') {
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
