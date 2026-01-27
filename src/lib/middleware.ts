/**
 * Authentication Middleware for API Routes
 * 
 * This module provides middleware functions to protect API routes
 * and enforce role-based access control
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { hasPermission, hasRole, RoleName, ResourceType, ActionType } from './permissions';

export type NextApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    roleId: string;
  };
}

/**
 * Middleware to require authentication
 * Adds user information to request object
 * 
 * @param handler - API route handler
 * @returns Wrapped handler with authentication check
 */
export function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Add user to request object
    (req as AuthenticatedRequest).user = session.user;

    return handler(req as AuthenticatedRequest, res);
  };
}

/**
 * Middleware to require specific role
 * 
 * @param roles - Array of allowed roles
 * @param handler - API route handler
 * @returns Wrapped handler with role check
 */
export function withRole(
  roles: RoleName[],
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const userRole = req.user.role;

    if (!roles.includes(userRole as RoleName)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }

    return handler(req, res);
  });
}

/**
 * Middleware to require specific permission
 * 
 * @param resource - Resource to check
 * @param action - Action to check
 * @param handler - API route handler
 * @returns Wrapped handler with permission check
 */
export function withPermission(
  resource: ResourceType,
  action: ActionType,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const hasAccess = await hasPermission(req.user.id, resource, action);

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to perform this action'
      });
    }

    return handler(req, res);
  });
}

/**
 * Middleware to require Super Admin role
 * 
 * @param handler - API route handler
 * @returns Wrapped handler with Super Admin check
 */
export function withSuperAdmin(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withRole(['Super Admin'], handler);
}

/**
 * Middleware to require Admin or Super Admin role
 * 
 * @param handler - API route handler
 * @returns Wrapped handler with Admin check
 */
export function withAdmin(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withRole(['Super Admin', 'Admin'], handler);
}
