/**
 * API endpoint for metrics settings management
 * GET: Fetch metrics settings (Admin/Super Admin only)
 * PUT: Update metrics settings (Super Admin only)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { getMetricsSettings, setSetting, DEFAULT_METRICS_SETTINGS } from '@/lib/settings';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only Super Admins and Admins can view settings
  if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Only Admins can view metrics settings'
    });
  }

  if (req.method === 'GET') {
    try {
      const settings = await getMetricsSettings();
      
      return res.status(200).json({ 
        settings,
        defaults: DEFAULT_METRICS_SETTINGS 
      });
    } catch (error) {
      console.error('[Settings API] Error fetching metrics settings:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch metrics settings'
      });
    }
  }

  if (req.method === 'PUT') {
    // Only Super Admins can update settings
    if (req.user.role !== 'Super Admin') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Only Super Admins can update metrics settings'
      });
    }

    try {
      const updates = req.body;

      // Validate input
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Request body must be a valid JSON object'
        });
      }

      // Validate specific fields if provided
      const validKeys = Object.keys(DEFAULT_METRICS_SETTINGS);
      const invalidKeys = Object.keys(updates).filter(key => !validKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        return res.status(400).json({
          error: 'Invalid settings',
          message: `Invalid setting keys: ${invalidKeys.join(', ')}`,
          validKeys
        });
      }

      // Validate types and values
      if ('metricsEnabled' in updates && typeof updates.metricsEnabled !== 'boolean') {
        return res.status(400).json({
          error: 'Invalid value',
          message: 'metricsEnabled must be a boolean'
        });
      }

      if ('historyCollectionEnabled' in updates && typeof updates.historyCollectionEnabled !== 'boolean') {
        return res.status(400).json({
          error: 'Invalid value',
          message: 'historyCollectionEnabled must be a boolean'
        });
      }

      if ('collectionIntervalSeconds' in updates) {
        const val = updates.collectionIntervalSeconds;
        if (typeof val !== 'number' || val < 10 || val > 3600) {
          return res.status(400).json({
            error: 'Invalid value',
            message: 'collectionIntervalSeconds must be a number between 10 and 3600'
          });
        }
      }

      if ('dataRetentionDays' in updates) {
        const val = updates.dataRetentionDays;
        if (typeof val !== 'number' || val < 1 || val > 365) {
          return res.status(400).json({
            error: 'Invalid value',
            message: 'dataRetentionDays must be a number between 1 and 365'
          });
        }
      }

      if ('aggregationEnabled' in updates && typeof updates.aggregationEnabled !== 'boolean') {
        return res.status(400).json({
          error: 'Invalid value',
          message: 'aggregationEnabled must be a boolean'
        });
      }

      if ('aggregationThresholdDays' in updates) {
        const val = updates.aggregationThresholdDays;
        if (typeof val !== 'number' || val < 1 || val > 90) {
          return res.status(400).json({
            error: 'Invalid value',
            message: 'aggregationThresholdDays must be a number between 1 and 90'
          });
        }
      }

      if ('aggregationIntervalHours' in updates) {
        const val = updates.aggregationIntervalHours;
        if (typeof val !== 'number' || ![1, 6, 12, 24].includes(val)) {
          return res.status(400).json({
            error: 'Invalid value',
            message: 'aggregationIntervalHours must be 1, 6, 12, or 24'
          });
        }
      }

      // Update settings
      for (const [key, value] of Object.entries(updates)) {
        await setSetting(key, value, 'metrics', `Setting for ${key}`);
      }

      // Fetch updated settings
      const updatedSettings = await getMetricsSettings();

      return res.status(200).json({ 
        message: 'Settings updated successfully',
        settings: updatedSettings
      });
    } catch (error) {
      console.error('[Settings API] Error updating metrics settings:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to update metrics settings'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
