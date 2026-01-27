/**
 * Home Page - Index Route
 * Redirects or provides information about the admin panel
 */

import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-8">
            🎮 SMP Admin Panel
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Minecraft Server Management System
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition-colors"
          >
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </>
  );
}
