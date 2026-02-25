/**
 * Custom App Component for SMP Admin Panel
 * This file wraps all pages and provides global functionality
 * - Imports global styles (Tailwind CSS)
 * - Wraps with NextAuth SessionProvider
 * - Wraps with InstanceProvider for multi-instance support
 * - Maintains state across page changes
 */

import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { InstanceProvider } from '@/contexts/InstanceContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session} basePath="/apanel44/api/auth">
      <InstanceProvider>
        <Component {...pageProps} />
      </InstanceProvider>
    </SessionProvider>
  );
}
