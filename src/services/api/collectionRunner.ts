import type {
  ApiRequest,
  Environment,
  ApiResponse,
  AssertionResult,
} from '../../types/api';
import { executeApiRequest } from './apiExecutor';
import { evaluateAssertions, executeRequestExtractions } from './assertionRunner';

export interface BatchItemResult {
  requestId: string;
  name: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  passed: boolean;
  assertionResults: AssertionResult[];
  error?: string;
}

export interface BatchRunSummary {
  collectionId: string;
  collectionName: string;
  startTime: string;
  endTime: string;
  totalDurationMs: number;
  totalRequests: number;
  passedRequests: number;
  failedRequests: number;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p95LatencyMs: number;
  results: BatchItemResult[];
}

export interface BatchRunnerOptions {
  collectionId: string;
  collectionName: string;
  requests: ApiRequest[];
  environment?: Environment;
  delayBetweenRequestsMs?: number;
  onProgress?: (completed: number, total: number, currentResult: BatchItemResult) => void;
  signal?: AbortSignal;
}

export async function runBatchCollection(options: BatchRunnerOptions): Promise<BatchRunSummary> {
  const {
    collectionId,
    collectionName,
    requests,
    environment,
    delayBetweenRequestsMs = 50,
    onProgress,
    signal,
  } = options;

  const startTime = new Date().toISOString();
  const startPerf = performance.now();
  const results: BatchItemResult[] = [];

  // Active working environment for variable chaining
  let workingEnv = environment ? JSON.parse(JSON.stringify(environment)) : undefined;

  for (let i = 0; i < requests.length; i++) {
    if (signal?.aborted) {
      break;
    }

    const req = requests[i];

    try {
      const response: ApiResponse = await executeApiRequest({
        request: req,
        environment: workingEnv,
        signal,
      });

      // Evaluate assertions
      const assertionResults = req.assertions && req.assertions.length > 0
        ? evaluateAssertions(req.assertions, response)
        : [];

      // Check request extraction rules for variable chaining
      if (req.extractions && req.extractions.length > 0 && workingEnv) {
        workingEnv = executeRequestExtractions(req.extractions, response, workingEnv);
      }

      const allAssertionsPassed = assertionResults.every((a) => a.passed);
      const isOverallPassed = !response.isError && (assertionResults.length === 0 || allAssertionsPassed);

      const itemResult: BatchItemResult = {
        requestId: req.id,
        name: req.name,
        method: req.method,
        url: req.url,
        status: response.status,
        statusText: response.statusText,
        timeMs: response.timeMs,
        sizeBytes: response.sizeBytes,
        passed: isOverallPassed,
        assertionResults,
        error: response.isError ? response.errorMessage : undefined,
      };

      results.push(itemResult);
      onProgress?.(i + 1, requests.length, itemResult);

      if (delayBetweenRequestsMs > 0 && i < requests.length - 1) {
        await new Promise((r) => setTimeout(r, delayBetweenRequestsMs));
      }
    } catch (err: any) {
      const itemResult: BatchItemResult = {
        requestId: req.id,
        name: req.name,
        method: req.method,
        url: req.url,
        status: 0,
        statusText: 'Failed',
        timeMs: 0,
        sizeBytes: 0,
        passed: false,
        assertionResults: [],
        error: err.message || 'Execution failed',
      };
      results.push(itemResult);
      onProgress?.(i + 1, requests.length, itemResult);
    }
  }

  const endPerf = performance.now();
  const endTime = new Date().toISOString();
  const totalDurationMs = Math.round(endPerf - startPerf);

  // Compute metrics
  const totalRequests = results.length;
  const passedRequests = results.filter((r) => r.passed).length;
  const failedRequests = totalRequests - passedRequests;

  let totalAssertions = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;

  const latencies: number[] = [];

  results.forEach((r) => {
    latencies.push(r.timeMs);
    r.assertionResults.forEach((a) => {
      totalAssertions++;
      if (a.passed) passedAssertions++;
      else failedAssertions++;
    });
  });

  latencies.sort((a, b) => a - b);
  const minLatencyMs = latencies.length ? latencies[0] : 0;
  const maxLatencyMs = latencies.length ? latencies[latencies.length - 1] : 0;
  const avgLatencyMs = latencies.length
    ? Math.round(latencies.reduce((sum, v) => sum + v, 0) / latencies.length)
    : 0;
  const p95Index = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
  const p95LatencyMs = latencies.length ? latencies[p95Index] : 0;

  return {
    collectionId,
    collectionName,
    startTime,
    endTime,
    totalDurationMs,
    totalRequests,
    passedRequests,
    failedRequests,
    totalAssertions,
    passedAssertions,
    failedAssertions,
    avgLatencyMs,
    minLatencyMs,
    maxLatencyMs,
    p95LatencyMs,
    results,
  };
}

/**
 * Generates JUnit XML test report standard for CI/CD integrations
 */
export function generateJUnitXmlReport(summary: BatchRunSummary): string {
  const escapeXml = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const durationSec = (summary.totalDurationMs / 1000).toFixed(3);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuites name="${escapeXml(summary.collectionName)}" time="${durationSec}" tests="${summary.totalRequests}" failures="${summary.failedRequests}">\n`;
  xml += `  <testsuite name="${escapeXml(summary.collectionName)}" tests="${summary.totalRequests}" failures="${summary.failedRequests}" time="${durationSec}" timestamp="${summary.startTime}">\n`;

  summary.results.forEach((r) => {
    const itemSec = (r.timeMs / 1000).toFixed(3);
    xml += `    <testcase name="${escapeXml(r.method + ' ' + r.name)}" classname="${escapeXml(summary.collectionName)}" time="${itemSec}">\n`;
    if (!r.passed) {
      const failureMsg = r.error || r.assertionResults.filter((a) => !a.passed).map((a) => a.message).join('; ') || 'Assertion failed';
      xml += `      <failure message="${escapeXml(failureMsg)}" type="AssertionError">${escapeXml(failureMsg)}</failure>\n`;
    }
    xml += `    </testcase>\n`;
  });

  xml += `  </testsuite>\n`;
  xml += `</testsuites>`;

  return xml;
}
