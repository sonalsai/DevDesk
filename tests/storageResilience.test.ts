import { describe, it, expect } from 'vitest';
import {
  calculateSha256,
  createExportEnvelope,
  verifyAndParseExportEnvelope,
  pruneApiHistoryIfExceeded,
  getStorageMetrics,
} from '../src/services/storage/storageQuotaService';
import {
  generateJUnitXmlReport,
  type BatchRunSummary,
} from '../src/services/collectionRunner';
import type { WorkspaceData } from '../src/types';
import { INITIAL_WORKSPACE } from '../src/services/storage';

describe('Enterprise Storage Resilience & Test Runner', () => {
  describe('SHA-256 Checksum & Envelope Integrity', () => {
    it('computes consistent cryptographic hash for identical payloads', async () => {
      const payload1 = JSON.stringify({ key: 'test-value', active: true });
      const payload2 = JSON.stringify({ key: 'test-value', active: true });
      const hash1 = await calculateSha256(payload1);
      const hash2 = await calculateSha256(payload2);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('creates and verifies export envelopes with matched checksum', async () => {
      const envelopeStr = await createExportEnvelope(INITIAL_WORKSPACE, false);
      const result = await verifyAndParseExportEnvelope(envelopeStr);

      expect(result.checksumMatched).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.version).toBe(5);
    });

    it('detects tampering or corruption when envelope payload changes', async () => {
      const envelopeStr = await createExportEnvelope(INITIAL_WORKSPACE, false);
      const tampered = JSON.parse(envelopeStr);
      tampered.payload.version = 999; // Modified!

      const result = await verifyAndParseExportEnvelope(JSON.stringify(tampered));
      expect(result.checksumMatched).toBe(false);
    });
  });

  describe('Storage Quota & LRU Pruning', () => {
    it('measures storage consumption and metrics', async () => {
      const metrics = await getStorageMetrics(INITIAL_WORKSPACE);
      expect(metrics.usedBytes).toBeGreaterThan(0);
      expect(metrics.quotaBytes).toBeGreaterThan(0);
      expect(metrics.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.isCritical).toBe(false);
    });

    it('prunes older API history when quota thresholds are exceeded', () => {
      const mockHistory: any[] = [];
      for (let i = 0; i < 100; i++) {
        mockHistory.push({
          id: `hist-${i}`,
          timestamp: new Date(Date.now() - i * 1000).toISOString(),
          url: `https://api.example.com/${i}`,
        });
      }

      const testData: WorkspaceData = {
        ...INITIAL_WORKSPACE,
        apiHistory: mockHistory,
      };

      expect(testData.apiHistory.length).toBe(100);
      const pruned = pruneApiHistoryIfExceeded(testData, 30);
      expect(pruned.apiHistory.length).toBe(30);
      // Newest should be preserved (hist-0)
      expect(pruned.apiHistory[0].id).toBe('hist-0');
    });
  });

  describe('Batch Collection Runner & JUnit Reporting', () => {
    it('generates well-formed JUnit XML reports for CI/CD', () => {
      const mockSummary: BatchRunSummary = {
        collectionId: 'col-1',
        collectionName: 'Production Gateway Tests',
        startTime: '2026-10-06T12:00:00Z',
        endTime: '2026-10-06T12:00:01Z',
        totalDurationMs: 450,
        totalRequests: 2,
        passedRequests: 1,
        failedRequests: 1,
        totalAssertions: 3,
        passedAssertions: 2,
        failedAssertions: 1,
        avgLatencyMs: 85,
        minLatencyMs: 60,
        maxLatencyMs: 110,
        p95LatencyMs: 110,
        results: [
          {
            requestId: 'req-1',
            name: 'Get User Profile',
            method: 'GET',
            url: 'https://api.example.com/me',
            status: 200,
            statusText: 'OK',
            timeMs: 60,
            sizeBytes: 512,
            passed: true,
            assertionResults: [
              { assertionId: 'a1', type: 'status_code', passed: true, message: 'Status is 200' },
            ],
          },
          {
            requestId: 'req-2',
            name: 'Create Invoice',
            method: 'POST',
            url: 'https://api.example.com/invoices',
            status: 400,
            statusText: 'Bad Request',
            timeMs: 110,
            sizeBytes: 120,
            passed: false,
            assertionResults: [
              { assertionId: 'a2', type: 'status_code', passed: false, message: 'Expected 201, got 400' },
            ],
            error: 'Expected 201, got 400',
          },
        ],
      };

      const xml = generateJUnitXmlReport(mockSummary);
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<testsuites name="Production Gateway Tests"');
      expect(xml).toContain('<testcase name="GET Get User Profile"');
      expect(xml).toContain('<failure message="Expected 201, got 400"');
    });
  });
});
