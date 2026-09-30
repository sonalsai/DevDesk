import type {
  ApiRequest,
  ApiResponse,
  Environment,
  ApiHistoryItem,
} from '../types/api';
import { interpolateVariables } from './environmentService';

export interface ExecuteOptions {
  request: ApiRequest;
  environment?: Environment;
  signal?: AbortSignal;
}

/**
 * Builds the full final URL with query parameters and resolved variables.
 */
export function buildResolvedUrl(request: ApiRequest, environment?: Environment): string {
  const rawUrl = interpolateVariables(request.url.trim(), environment);
  if (!rawUrl) return '';

  try {
    // If user provided a protocol-relative or path URL, normalize with http:// if needed
    const normalizedUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;

    const urlObj = new URL(normalizedUrl);

    // Merge enabled query parameters
    request.params.forEach((param) => {
      if (param.enabled && param.key.trim()) {
        const resolvedKey = interpolateVariables(param.key.trim(), environment);
        const resolvedVal = interpolateVariables(param.value, environment);
        urlObj.searchParams.set(resolvedKey, resolvedVal);
      }
    });

    // Check if API Key auth is configured as query param
    if (
      request.auth.type === 'apikey' &&
      request.auth.apiKeyHeaderOrQuery === 'query' &&
      request.auth.apiKeyName &&
      request.auth.apiKeyValue
    ) {
      const keyName = interpolateVariables(request.auth.apiKeyName, environment);
      const keyVal = interpolateVariables(request.auth.apiKeyValue, environment);
      urlObj.searchParams.set(keyName, keyVal);
    }

    return urlObj.toString();
  } catch {
    // Return interpolated raw url if parsing as URL fails (e.g. while user is still typing)
    return rawUrl;
  }
}

/**
 * Builds resolved HTTP headers including auth headers.
 */
export function buildResolvedHeaders(
  request: ApiRequest,
  environment?: Environment
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Custom table headers
  request.headers.forEach((h) => {
    if (h.enabled && h.key.trim()) {
      const k = interpolateVariables(h.key.trim(), environment);
      const v = interpolateVariables(h.value, environment);
      headers[k] = v;
    }
  });

  // Auth Header Injection
  if (request.auth.type === 'bearer' && request.auth.bearerToken) {
    const token = interpolateVariables(request.auth.bearerToken, environment);
    headers['Authorization'] = `Bearer ${token}`;
  } else if (
    request.auth.type === 'basic' &&
    (request.auth.basicUsername || request.auth.basicPassword)
  ) {
    const u = interpolateVariables(request.auth.basicUsername || '', environment);
    const p = interpolateVariables(request.auth.basicPassword || '', environment);
    const b64 = btoa(`${u}:${p}`);
    headers['Authorization'] = `Basic ${b64}`;
  } else if (
    request.auth.type === 'apikey' &&
    request.auth.apiKeyHeaderOrQuery === 'header' &&
    request.auth.apiKeyName &&
    request.auth.apiKeyValue
  ) {
    const keyName = interpolateVariables(request.auth.apiKeyName, environment);
    const keyVal = interpolateVariables(request.auth.apiKeyValue, environment);
    headers[keyName] = keyVal;
  }

  // Set default Content-Type if body present and not explicitly defined
  const hasContentType = Object.keys(headers).some(
    (k) => k.toLowerCase() === 'content-type'
  );

  if (!hasContentType && request.method !== 'GET' && request.method !== 'HEAD') {
    if (request.body.type === 'json' && request.body.jsonContent.trim()) {
      headers['Content-Type'] = 'application/json';
    } else if (request.body.type === 'form-urlencoded') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
  }

  return headers;
}

/**
 * Builds the resolved request body.
 */
export function buildResolvedBody(
  request: ApiRequest,
  environment?: Environment
): BodyInit | undefined {
  if (request.method === 'GET' || request.method === 'HEAD' || request.body.type === 'none') {
    return undefined;
  }

  if (request.body.type === 'json') {
    return interpolateVariables(request.body.jsonContent, environment);
  }

  if (request.body.type === 'raw') {
    return interpolateVariables(request.body.rawText, environment);
  }

  if (request.body.type === 'form-urlencoded') {
    const params = new URLSearchParams();
    request.body.formParams.forEach((p) => {
      if (p.enabled && p.key.trim()) {
        params.append(
          interpolateVariables(p.key.trim(), environment),
          interpolateVariables(p.value, environment)
        );
      }
    });
    return params.toString();
  }

  if (request.body.type === 'multipart') {
    const formData = new FormData();
    request.body.multipartParams.forEach((p) => {
      if (p.enabled && p.key.trim()) {
        formData.append(
          interpolateVariables(p.key.trim(), environment),
          interpolateVariables(p.value, environment)
        );
      }
    });
    return formData;
  }

  return undefined;
}

/**
 * Execute an API request via browser fetch with timing and diagnostic error reporting.
 */
export async function executeApiRequest(options: ExecuteOptions): Promise<ApiResponse> {
  const { request, environment, signal } = options;

  const url = buildResolvedUrl(request, environment);
  const headers = buildResolvedHeaders(request, environment);
  const body = buildResolvedBody(request, environment);

  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      signal,
    });

    const elapsedMs = Math.round(performance.now() - startTime);

    // Collect response headers
    const resHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      resHeaders[key] = val;
    });

    // Content type
    const contentType = response.headers.get('content-type') || 'text/plain';

    // Body text
    const textData = await response.text();

    // Actual size in bytes
    const contentLength = response.headers.get('content-length');
    const sizeBytes = contentLength
      ? parseInt(contentLength, 10)
      : new Blob([textData]).size;

    return {
      status: response.status,
      statusText: response.statusText,
      timeMs: elapsedMs,
      sizeBytes,
      headers: resHeaders,
      data: textData,
      contentType,
      isError: false,
    };
  } catch (err: any) {
    const elapsedMs = Math.round(performance.now() - startTime);

    if (err.name === 'AbortError' || signal?.aborted) {
      return {
        status: 0,
        statusText: 'Cancelled',
        timeMs: elapsedMs,
        sizeBytes: 0,
        headers: {},
        data: '',
        contentType: 'text/plain',
        isError: true,
        errorMessage: 'Request was cancelled by user.',
        errorType: 'abort',
      };
    }

    // Distinguish CORS from general network errors
    const isCorsPotential =
      err.name === 'TypeError' && err.message.toLowerCase().includes('failed to fetch');

    const errorMessage = isCorsPotential
      ? `Request blocked by browser. This typically occurs because:\n1. The target server does not send Access-Control-Allow-Origin headers for this origin (CORS restriction).\n2. The URL is invalid or the server is not reachable.\n3. The SSL/TLS certificate is invalid or self-signed.`
      : `Network request error: ${err.message || 'Unknown network error'}`;

    return {
      status: 0,
      statusText: 'Network / CORS Error',
      timeMs: elapsedMs,
      sizeBytes: 0,
      headers: {},
      data: '',
      contentType: 'text/plain',
      isError: true,
      errorMessage,
      errorType: isCorsPotential ? 'cors' : 'network',
    };
  }
}

/**
 * Creates a sanitized history item without passwords, secret tokens, or sensitive auth data.
 */
export function createSanitizedHistoryItem(
  request: ApiRequest,
  response: ApiResponse
): ApiHistoryItem {
  // Strip auth credentials completely from snapshot
  const { auth: _auth, ...snapshotWithoutAuth } = request;

  // Mask any raw tokens or basic credentials in headers
  const sanitizedHeaders = snapshotWithoutAuth.headers.map((h) => {
    if (h.key.toLowerCase().includes('authorization') || h.key.toLowerCase().includes('token')) {
      return { ...h, value: '••••••••••••' };
    }
    return h;
  });

  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    method: request.method,
    url: request.url,
    status: response.status,
    statusText: response.statusText,
    timeMs: response.timeMs,
    sizeBytes: response.sizeBytes,
    timestamp: new Date().toISOString(),
    requestSnapshot: {
      ...snapshotWithoutAuth,
      headers: sanitizedHeaders,
    },
  };
}
