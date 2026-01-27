/**
 * Health Check API Route
 * Endpoint: /api/health
 * 
 * This is a simple API route that returns the health status of the application.
 * It demonstrates:
 * - Next.js API routes functionality
 * - Server-side execution
 * - JSON response handling
 */

import type { NextApiRequest, NextApiResponse } from 'next';

type HealthResponse = {
  status: string;
  timestamp: string;
  message: string;
  dependencies: {
    nextAuth: boolean;
    prisma: boolean;
    nodemailer: boolean;
    nodepty: boolean;
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Method not allowed',
      dependencies: {
        nextAuth: false,
        nodemailer: false,
        prisma: false,
        nodepty: false,
      },
    });
    return;
  }

  // Return health status
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'SMP Admin Panel API is running',
    dependencies: {
      nextAuth: true,
      prisma: true,
      nodemailer: true,
      nodepty: true,
    },
  });
}
