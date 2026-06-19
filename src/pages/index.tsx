/**
 * Home Page - Index Route
 * Redirects or provides information about the admin panel
 */

import Head from 'next/head';
import Link from 'next/link';
import { Pickaxe, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Head>
        <title>SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 vignette" />

        <div className="relative z-10 text-center">
          <span className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 mb-6 glow-green-sm">
            <Pickaxe className="h-10 w-10" />
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold text-green-400 text-glow mb-4">SMP Admin Panel</h1>
          <p className="text-xl text-gray-400 mb-8">Minecraft Server Management System</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 transition-all hover:glow-green-sm"
          >
            Go to Dashboard <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </>
  );
}
