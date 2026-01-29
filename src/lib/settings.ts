/**
 * Settings Management Utility
 * Manages system-wide settings with defaults for metrics collection
 */

import prisma from './prisma';

// Default settings for metrics collection
export const DEFAULT_METRICS_SETTINGS = {
  metricsEnabled: true,
  historyCollectionEnabled: true,
  collectionIntervalSeconds: 60, // Collect metrics every 60 seconds
  dataRetentionDays: 30, // Keep raw data for 30 days
  aggregationEnabled: true,
  aggregationThresholdDays: 7, // Aggregate data older than 7 days
  aggregationIntervalHours: 1, // Hourly aggregation
};

/**
 * Get a setting value by key
 * Returns default value if setting doesn't exist
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key },
    });

    if (!setting) {
      return defaultValue;
    }

    return JSON.parse(setting.value) as T;
  } catch (error) {
    console.error(`[Settings] Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Set a setting value by key
 */
export async function setSetting(key: string, value: unknown, category = 'metrics', description?: string): Promise<void> {
  try {
    await prisma.settings.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
        category,
        description,
        updatedAt: new Date(),
      },
      create: {
        key,
        value: JSON.stringify(value),
        category,
        description,
      },
    });
  } catch (error) {
    console.error(`[Settings] Error setting ${key}:`, error);
    throw error;
  }
}

/**
 * Get all settings for a category
 */
export async function getSettingsByCategory(category: string): Promise<Record<string, unknown>> {
  try {
    const settings = await prisma.settings.findMany({
      where: { category },
    });

    const result: Record<string, unknown> = {};
    for (const setting of settings) {
      try {
        result[setting.key] = JSON.parse(setting.value);
      } catch (parseError) {
        console.warn(`[Settings] Failed to parse JSON value for ${setting.key}, using raw value:`, parseError);
        result[setting.key] = setting.value;
      }
    }

    return result;
  } catch (error) {
    console.error(`[Settings] Error getting settings for category ${category}:`, error);
    return {};
  }
}

/**
 * Get metrics-specific settings with defaults
 */
export async function getMetricsSettings() {
  const settings = await getSettingsByCategory('metrics');
  
  return {
    metricsEnabled: settings.metricsEnabled !== undefined ? (settings.metricsEnabled as boolean) : DEFAULT_METRICS_SETTINGS.metricsEnabled,
    historyCollectionEnabled: settings.historyCollectionEnabled !== undefined ? (settings.historyCollectionEnabled as boolean) : DEFAULT_METRICS_SETTINGS.historyCollectionEnabled,
    collectionIntervalSeconds: settings.collectionIntervalSeconds !== undefined ? (settings.collectionIntervalSeconds as number) : DEFAULT_METRICS_SETTINGS.collectionIntervalSeconds,
    dataRetentionDays: settings.dataRetentionDays !== undefined ? (settings.dataRetentionDays as number) : DEFAULT_METRICS_SETTINGS.dataRetentionDays,
    aggregationEnabled: settings.aggregationEnabled !== undefined ? (settings.aggregationEnabled as boolean) : DEFAULT_METRICS_SETTINGS.aggregationEnabled,
    aggregationThresholdDays: settings.aggregationThresholdDays !== undefined ? (settings.aggregationThresholdDays as number) : DEFAULT_METRICS_SETTINGS.aggregationThresholdDays,
    aggregationIntervalHours: settings.aggregationIntervalHours !== undefined ? (settings.aggregationIntervalHours as number) : DEFAULT_METRICS_SETTINGS.aggregationIntervalHours,
  };
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  try {
    const existingSettings = await getSettingsByCategory('metrics');
    
    // Only create defaults if no metrics settings exist
    if (Object.keys(existingSettings).length === 0) {
      console.log('[Settings] Initializing default metrics settings...');
      
      for (const [key, value] of Object.entries(DEFAULT_METRICS_SETTINGS)) {
        await setSetting(
          key,
          value,
          'metrics',
          `Default setting for ${key}`
        );
      }
      
      console.log('[Settings] Default metrics settings initialized');
    }
  } catch (error) {
    console.error('[Settings] Error initializing default settings:', error);
  }
}
