/**
 * API endpoint for user management
 * GET: List users
 * POST: Create user
 */

import { NextApiResponse } from 'next';
import { withSuperAdmin, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // List users
    try {
      const users = await prisma.user.findMany({
        include: {
          role: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Remove sensitive data
      const sanitizedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorMethod: user.twoFactorMethod,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      }));

      return res.status(200).json({ users: sanitizedUsers });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    // Create user
    try {
      const { email, password, name, roleId } = req.body;

      if (!email || !password || !name || !roleId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          roleId,
        },
        include: {
          role: true,
        },
      });

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'create_user',
        resource: 'user',
        resourceId: user.id,
        details: { email, name, role: role.name },
        req,
      });

      // Remove sensitive data
      const { password: _, ...sanitizedUser } = user;

      return res.status(201).json({ user: sanitizedUser });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withSuperAdmin(handler);
