/**
 * Custom App Component for SMP Admin Panel
 * This file wraps all pages and provides global functionality
 * - Imports global styles (Tailwind CSS)
 * - Can be used to add providers (e.g., NextAuth session provider)
 * - Maintains state across page changes
 */

import type { AppProps } from 'next/app';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
