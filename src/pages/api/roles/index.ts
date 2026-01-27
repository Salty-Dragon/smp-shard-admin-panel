/**
 * API endpoint for role management
 * GET: List roles with permissions
 */

import { NextApiResponse } from 'next';
import { withSuperAdmin, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const roles = await prisma.role.findMany({
        include: {
          permissions: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({ roles });
    } catch (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withSuperAdmin(handler);
