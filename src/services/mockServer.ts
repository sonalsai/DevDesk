import type {
  HttpMethod,
  MockEndpoint,
  MockScenario,
  MockRequestLog,
} from '../types/api';

export interface RouteMatchResult {
  endpoint: MockEndpoint;
  scenario: MockScenario;
  pathParams: Record<string, string>;
}

/**
 * Normalizes a URL or path string down to its pathname.
 * Handles full URLs ('http://localhost:3000/api/users') and root paths ('/api/users?sort=desc').
 */
export function normalizePath(pathOrUrl: string): string {
  try {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return new URL(pathOrUrl).pathname;
    }
  } catch {
    // fallback to string slicing
  }
  return pathOrUrl.split('?')[0].replace(/\/+$/, '') || '/';
}

/**
 * Matches an incoming HTTP method and request path against defined mock endpoints.
 * Supports static paths ('/api/v1/users') and parameterized routes ('/api/v1/users/:id').
 */
export function matchMockRoute(
  endpoints: MockEndpoint[],
  method: HttpMethod,
  requestPathOrUrl: string
): RouteMatchResult | null {
  const reqPath = normalizePath(requestPathOrUrl);
  const reqSegments = reqPath.split('/').filter(Boolean);

  for (const endpoint of endpoints) {
    if (!endpoint.enabled || endpoint.method !== method) continue;

    const endPath = normalizePath(endpoint.path);
    const endSegments = endPath.split('/').filter(Boolean);

    if (reqSegments.length !== endSegments.length) continue;

    const pathParams: Record<string, string> = {};
    let matches = true;

    for (let i = 0; i < endSegments.length; i++) {
      const endSeg = endSegments[i];
      const reqSeg = reqSegments[i];

      if (endSeg.startsWith(':')) {
        const paramKey = endSeg.slice(1);
        pathParams[paramKey] = reqSeg;
      } else if (endSeg.toLowerCase() !== reqSeg.toLowerCase()) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // Find active scenario or fallback to default
      const scenario =
        endpoint.scenarios.find((s) => s.id === endpoint.activeScenarioId) ||
        endpoint.scenarios.find((s) => s.isDefault) ||
        endpoint.scenarios[0];

      if (scenario) {
        return {
          endpoint,
          scenario,
          pathParams,
        };
      }
    }
  }

  return null;
}

/**
 * Simulates executing a matched mock route with user-specified latency and response body.
 */
export async function executeMockRequest(
  scenario: MockScenario
): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
}> {
  const startTime = performance.now();

  // Simulate server latency if configured
  if (scenario.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(scenario.delayMs, 5000)));
  }

  const elapsed = Math.round(performance.now() - startTime);

  const responseHeaders: Record<string, string> = {
    'content-type': scenario.contentType || 'application/json; charset=utf-8',
    'x-devdesk-mock': 'true',
    'x-devdesk-scenario': scenario.name,
  };

  (scenario.headers || []).forEach((h) => {
    if (h.enabled && h.key) {
      responseHeaders[h.key.toLowerCase()] = h.value;
    }
  });

  return {
    status: scenario.status,
    statusText: scenario.statusText || getStatusText(scenario.status),
    headers: responseHeaders,
    body: scenario.body,
    timeMs: elapsed,
  };
}

/**
 * Creates a lightweight request log for simulated mock runs.
 */
export function createMockRequestLog(
  method: HttpMethod,
  path: string,
  status: number,
  timeMs: number,
  headers: Record<string, string>,
  query: Record<string, string>,
  body: string,
  endpointId?: string
): MockRequestLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    endpointId,
    method,
    path,
    timestamp: new Date().toISOString(),
    status,
    timeMs,
    headers,
    query,
    body: body ? (body.length > 500 ? body.slice(0, 500) + '...' : body) : '',
  };
}

function getStatusText(code: number): string {
  switch (code) {
    case 200: return 'OK';
    case 201: return 'Created';
    case 204: return 'No Content';
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    case 500: return 'Internal Server Error';
    case 502: return 'Bad Gateway';
    case 503: return 'Service Unavailable';
    default: return code >= 200 && code < 300 ? 'Success' : 'Error';
  }
}

export interface MockSimulationResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  delayMs: number;
  matchedEndpoint: MockEndpoint | null;
  scenario: MockScenario | null;
  pathParams: Record<string, string>;
}

/**
 * Executes a simulated mock request against registered mock endpoints.
 */
export async function executeMockSimulation(
  method: HttpMethod,
  path: string,
  _query: Record<string, string>,
  _body: string,
  endpoints: MockEndpoint[]
): Promise<MockSimulationResult> {
  const match = matchMockRoute(endpoints, method, path);
  if (!match) {
    return {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'content-type': 'application/json',
        'x-devdesk-mock': 'true',
      },
      body: JSON.stringify(
        { error: 'Route not matched in DevDesk Mock Server', method, path },
        null,
        2
      ),
      delayMs: 15,
      matchedEndpoint: null,
      scenario: null,
      pathParams: {},
    };
  }

  const { endpoint, scenario, pathParams } = match;
  const execRes = await executeMockRequest(scenario);

  return {
    status: execRes.status,
    statusText: execRes.statusText,
    headers: execRes.headers,
    body: execRes.body,
    delayMs: execRes.timeMs,
    matchedEndpoint: endpoint,
    scenario,
    pathParams,
  };
}

