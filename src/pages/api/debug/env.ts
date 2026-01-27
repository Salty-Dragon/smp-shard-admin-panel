/**
 * Debug endpoint to check environment variables
 * WARNING: This should be protected or removed in production
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development or with special header
  if (process.env.NODE_ENV === 'production' && req.headers['x-debug-token'] !== process.env.DEBUG_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const envVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
    SECRET: process.env.SECRET ? '***SET***' : 'NOT_SET',
    SECRET_LENGTH: process.env.SECRET?.length || 0,
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    DATABASE_URL: process.env.DATABASE_URL ? '***SET***' : 'NOT_SET',
    SMTP_HOST: process.env.SMTP_HOST || 'NOT_SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT_SET',
    SMTP_USER: process.env.SMTP_USER ? '***SET***' : 'NOT_SET',
    SMTP_PASS: process.env.SMTP_PASS ? '***SET***' : 'NOT_SET',
  };

  console.log('[Debug] Environment variables checked:', envVars);

  return res.status(200).json({
    message: 'Environment variables status',
    env: envVars,
    timestamp: new Date().toISOString(),
  });
}
