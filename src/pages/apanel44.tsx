/**
 * Dashboard Page for SMP Admin Panel
 * Accessible at: /apanel44
 * 
 * This is the main dashboard page for the admin panel.
 * It displays a welcome message and confirms the basic structure works.
 * 
 * Features to be implemented:
 * - 2FA Authentication (NextAuth.js with email OTP or Google Authenticator)
 * - Server console management (tmux integration via node-pty)
 * - Server statistics and monitoring
 * - Player management
 * - Configuration management
 */

import { GetServerSideProps } from 'next';
import Head from 'next/head';

interface DashboardProps {
  timestamp: string;
}

export default function Dashboard({ timestamp }: DashboardProps) {
  return (
    <>
      <Head>
        <title>SMP Admin Panel - Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              🎮 SMP Admin Panel
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Server Management Panel for Minecraft SMP
            </p>
          </header>

          {/* Welcome Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-4">
                Welcome to the SMP Admin Panel!
              </h2>

              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                The foundational structure has been successfully set up.
                Basic integration is working properly! ✅
              </p>

              <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🔧 System Status
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Next.js with TypeScript - Configured
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    TailwindCSS - Configured
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Server-Side Rendering - Enabled
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Page Rendered at: {timestamp}
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  📦 Installed Dependencies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div>• NextAuth.js - Authentication</div>
                  <div>• Prisma - ORM with MariaDB</div>
                  <div>• bcryptjs - Password hashing</div>
                  <div>• nodemailer - Email (SMTP)</div>
                  <div>• speakeasy - TOTP for 2FA</div>
                  <div>• node-pty - tmux integration</div>
                </div>
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🚀 Next Steps
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Configure environment variables in .env (use .env.example as a template)</li>
                <li>Set up your MariaDB database</li>
                <li>Run Prisma migrations to create database schema</li>
                <li>Implement authentication with NextAuth.js</li>
                <li>Build server console management features</li>
                <li>Add player and configuration management</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * GetServerSideProps - Enables Server-Side Rendering (SSR)
 * This function runs on the server for each request, demonstrating SSR is working
 */
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      timestamp: new Date().toISOString(),
    },
  };
};
