/**
 * Custom Document Component for SMP Admin Panel
 * This file customizes the HTML document structure
 * - Sets up the HTML document structure
 * - Useful for adding meta tags, fonts, or custom scripts
 * - Only rendered on the server
 */

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="SMP Shard Admin Panel - Server Management" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
