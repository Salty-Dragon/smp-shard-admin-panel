/**
 * Permission and Role-Based Access Control Utilities
 * 
 * This module provides functions for checking user permissions and roles
 */

import prisma from './prisma';

export type RoleName = 'Super Admin' | 'Admin' | 'Moderator';

export type ResourceType = 'logs' | 'users' | 'roles' | 'dashboard' | 'server' | 'permissions';

export type ActionType = 'read' | 'write' | 'delete' | 'manage';

/**
 * Check if a user has a specific permission
 * 
 * @param userId - User's ID
 * @param resource - Resource to check (e.g., 'logs', 'users')
 * @param action - Action to check (e.g., 'read', 'write')
 * @returns Promise<boolean> - True if user has permission
 */
export async function hasPermission(
  userId: string,
  resource: ResourceType,
  action: ActionType
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Super Admin has all permissions
    if (user.role.name === 'Super Admin') {
      return true;
    }

    // Check if user's role has the specific permission
    const hasPermission = user.role.permissions.some(
      (permission) =>
        permission.resource === resource && permission.action === action
    );

    return hasPermission;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if a user has a specific role
 * 
 * @param userId - User's ID
 * @param roleName - Role name to check
 * @returns Promise<boolean> - True if user has the role
 */
export async function hasRole(userId: string, roleName: RoleName): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    return user?.role.name === roleName;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Get user's role name
 * 
 * @param userId - User's ID
 * @returns Promise<string | null> - Role name or null
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    return user?.role.name || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if a role has a specific permission
 * 
 * @param roleName - Role name
 * @param resource - Resource to check
 * @param action - Action to check
 * @returns Promise<boolean> - True if role has permission
 */
export async function roleHasPermission(
  roleName: RoleName,
  resource: ResourceType,
  action: ActionType
): Promise<boolean> {
  try {
    // Super Admin has all permissions
    if (roleName === 'Super Admin') {
      return true;
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
      include: { permissions: true },
    });

    if (!role) {
      return false;
    }

    return role.permissions.some(
      (permission) =>
        permission.resource === resource && permission.action === action
    );
  } catch (error) {
    console.error('Error checking role permission:', error);
    return false;
  }
}
