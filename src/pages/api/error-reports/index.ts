/**
 * API endpoint for error reports
 * GET: Fetch error reports (Super Admin only)
 * POST: Create a new error report
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Check if user has permission to view error reports (Super Admin only)
      const isSuperAdmin = req.user.role === 'Super Admin';

      if (!isSuperAdmin) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only Super Admins can view error reports'
        });
      }

      // Parse query parameters
      const {
        page = '1',
        limit = '50',
        status,
        severity,
      } = req.query;

      const where: any = {};

      if (status && typeof status === 'string') {
        where.status = status;
      }

      if (severity && typeof severity === 'string') {
        where.severity = severity;
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [errorReports, total] = await Promise.all([
        prisma.errorReport.findMany({
          where,
          include: {
            user: {
              select: {
                name: true,
                email: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.errorReport.count({ where }),
      ]);

      return res.status(200).json({
        errorReports,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      });
    } catch (error) {
      console.error('Error fetching error reports:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, severity, page, stackTrace } = req.body;

      // Validate required fields
      if (!title || !description || !severity) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Title, description, and severity are required'
        });
      }

      // Validate severity
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(severity)) {
        return res.status(400).json({ 
          error: 'Invalid severity',
          message: 'Severity must be one of: low, medium, high, critical'
        });
      }

      // Create error report
      const errorReport = await prisma.errorReport.create({
        data: {
          userId: req.user.id,
          title,
          description,
          severity,
          page: page || null,
          stackTrace: stackTrace || null,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: getIpAddress(req),
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'create_error_report',
        resource: 'error_report',
        resourceId: errorReport.id,
        details: { title, severity },
        req,
      });

      return res.status(201).json({ errorReport });
    } catch (error) {
      console.error('Error creating error report:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function getIpAddress(req: AuthenticatedRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const real = req.headers['x-real-ip'];

  if (forwarded) {
    return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
  }

  if (real) {
    return typeof real === 'string' ? real : real[0];
  }

  return req.socket.remoteAddress || 'unknown';
}

export default withAuth(handler);
