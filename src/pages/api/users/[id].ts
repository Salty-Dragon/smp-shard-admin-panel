/**
 * API endpoint for individual user operations
 * PUT: Update user
 * DELETE: Delete user
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withSuperAdmin, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (req.method === 'PUT') {
    // Update user
    try {
      const { email, password, name, roleId } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prepare update data
      const updateData: any = {};

      if (email) {
        // Check if email is already taken by another user
        const emailTaken = await prisma.user.findFirst({
          where: { email, NOT: { id } },
        });
        if (emailTaken) {
          return res.status(409).json({ error: 'Email already taken' });
        }
        updateData.email = email;
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (name) {
        updateData.name = name;
      }

      if (roleId) {
        // Check if role exists
        const role = await prisma.role.findUnique({
          where: { id: roleId },
        });
        if (!role) {
          return res.status(400).json({ error: 'Invalid role' });
        }
        updateData.roleId = roleId;
      }

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          role: true,
        },
      });

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'update_user',
        resource: 'user',
        resourceId: id,
        details: { updates: Object.keys(updateData) },
        req,
      });

      // Remove sensitive data
      const { password: _, ...sanitizedUser } = user;

      return res.status(200).json({ user: sanitizedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    // Delete user
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent self-deletion
      if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
      }

      // Delete user
      await prisma.user.delete({
        where: { id },
      });

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'delete_user',
        resource: 'user',
        resourceId: id,
        details: { email: existingUser.email },
        req,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withSuperAdmin(handler);
