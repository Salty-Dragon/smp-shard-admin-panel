/**
 * API endpoint for managing role permissions
 * PUT: Update role permissions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withSuperAdmin, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid role ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Permissions must be an array' });
      }

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Don't allow modifying Super Admin permissions
      if (role.name === 'Super Admin') {
        return res.status(400).json({ 
          error: 'Cannot modify Super Admin permissions' 
        });
      }

      // Delete existing permissions
      await prisma.permission.deleteMany({
        where: { roleId: id },
      });

      // Create new permissions
      const permissionPromises = permissions.map((perm: any) => {
        return prisma.permission.create({
          data: {
            roleId: id,
            resource: perm.resource,
            action: perm.action,
          },
        });
      });

      await Promise.all(permissionPromises);

      // Get updated role
      const updatedRole = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: true,
        },
      });

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'update_role',
        resource: 'role',
        resourceId: id,
        details: { roleName: role.name, permissionCount: permissions.length },
        req,
      });

      return res.status(200).json({ role: updatedRole });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withSuperAdmin(handler);
