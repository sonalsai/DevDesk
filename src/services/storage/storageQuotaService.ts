import type { WorkspaceData } from '../../types';

export interface StorageMetrics {
  usedBytes: number;
  quotaBytes: number;
  percentage: number;
  isWarning: boolean;
  isCritical: boolean;
  historyCount: number;
  collectionsCount: number;
  tasksCount: number;
}

/**
 * Computes a cryptographic SHA-256 checksum string for data integrity verification
 */
export async function calculateSha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Pure JS fallback FNV-1a 32-bit hash
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
}

/**
 * Inspects browser storage usage & estimate
 */
export async function getStorageMetrics(data: WorkspaceData): Promise<StorageMetrics> {
  const serialized = JSON.stringify(data);
  const usedBytes = new Blob([serialized]).size;

  let quotaBytes = 5 * 1024 * 1024; // Default 5 MB localStorage baseline

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.quota > 0) {
        quotaBytes = Math.min(estimate.quota, 50 * 1024 * 1024); // Cap visualization to sensible bounds
      }
    } catch {
      // Use fallback
    }
  }

  const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 1000) / 10);
  const isWarning = percentage >= 70;
  const isCritical = percentage >= 90;

  return {
    usedBytes,
    quotaBytes,
    percentage,
    isWarning,
    isCritical,
    historyCount: data.apiHistory?.length || 0,
    collectionsCount: data.apiCollections?.length || 0,
    tasksCount: data.tasks?.length || 0,
  };
}

/**
 * Prunes older API history items if history exceeds maximum retained limit (LRU protection)
 */
export function pruneApiHistoryIfExceeded(data: WorkspaceData, maxHistoryItems = 75): WorkspaceData {
  if (!data.apiHistory || data.apiHistory.length <= maxHistoryItems) {
    return data;
  }

  // Keep the most recent `maxHistoryItems` entries
  const trimmed = [...data.apiHistory]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, maxHistoryItems);

  return {
    ...data,
    apiHistory: trimmed,
  };
}

export interface WorkspaceExportEnvelope {
  format: 'devdesk-workspace';
  version: number;
  exportedAt: string;
  checksum: string;
  payload: WorkspaceData;
}

/**
 * Creates export envelope with integrity checksum
 */
export async function createExportEnvelope(
  data: WorkspaceData,
  includeSecrets = false
): Promise<string> {
  let exportData = data;
  if (!includeSecrets && data.environments) {
    exportData = {
      ...data,
      environments: data.environments.map((env) => ({
        ...env,
        variables: env.variables.map((v) =>
          v.isSecret ? { ...v, value: '••••••••••••' } : v
        ),
      })),
    };
  }

  const payloadStr = JSON.stringify(exportData);
  const checksum = await calculateSha256(payloadStr);

  const envelope: WorkspaceExportEnvelope = {
    format: 'devdesk-workspace',
    version: exportData.version || 5,
    exportedAt: new Date().toISOString(),
    checksum,
    payload: exportData,
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Verifies and parses imported workspace with checksum validation
 */
export async function verifyAndParseExportEnvelope(jsonStr: string): Promise<{
  data: WorkspaceData;
  checksumMatched: boolean;
  exportedAt?: string;
}> {
  const parsed = JSON.parse(jsonStr);

  // Check if it's an envelope format
  if (parsed && parsed.format === 'devdesk-workspace' && parsed.payload) {
    const rawPayload = JSON.stringify(parsed.payload);
    const calculated = await calculateSha256(rawPayload);
    const checksumMatched = calculated === parsed.checksum;

    return {
      data: parsed.payload,
      checksumMatched,
      exportedAt: parsed.exportedAt,
    };
  }

  // Legacy direct JSON format
  return {
    data: parsed,
    checksumMatched: false,
  };
}
