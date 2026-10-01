import { describe, it, expect } from 'vitest';
import {
  interpolateVariables,
  extractReferencedVariables,
  compareEnvironments,
  exportDotEnvExample,
} from '../src/services/environmentService';
import { parseCurlToRequest, generateCurlCommand } from '../src/services/curlParser';
import { createSanitizedHistoryItem, buildResolvedUrl, buildResolvedHeaders } from '../src/services/apiExecutor';
import { generateCodeSnippet } from '../src/services/codeGenerator';
import { migrateWorkspaceData } from '../src/services/storage';
import type { Environment, ApiRequest, ApiResponse } from '../src/types/api';

const sampleEnv: Environment = {
  id: 'env-test',
  name: 'Testing',
  variables: [
    { id: 'v1', key: 'base_url', value: 'https://api.example.com', isSecret: false, enabled: true },
    { id: 'v2', key: 'api_token', value: 'secret_token_123', isSecret: true, enabled: true },
    { id: 'v3', key: 'disabled_var', value: 'ignore_me', isSecret: false, enabled: false },
  ],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('Environment Service & Variable Interpolation', () => {

  it('interpolates enabled environment variables', () => {
    const input = '{{base_url}}/users?token={{api_token}}';
    const result = interpolateVariables(input, sampleEnv);
    expect(result).toBe('https://api.example.com/users?token=secret_token_123');
  });

  it('leaves unresolved and disabled variables intact for developer visibility', () => {
    const input = '{{base_url}}/items/{{undefined_id}}?foo={{disabled_var}}';
    const result = interpolateVariables(input, sampleEnv);
    expect(result).toBe('https://api.example.com/items/{{undefined_id}}?foo={{disabled_var}}');
  });

  it('extracts unique variable names from text', () => {
    const text = '{{base_url}}/users/{{user_id}}?role={{role}}&env={{base_url}}';
    const vars = extractReferencedVariables(text);
    expect(vars).toEqual(['base_url', 'user_id', 'role']);
  });

  it('compares two environments side-by-side correctly', () => {
    const envB: Environment = {
      id: 'env-prod',
      name: 'Production',
      variables: [
        { id: 'vb1', key: 'base_url', value: 'https://prod.example.com', isSecret: false, enabled: true },
        { id: 'vb2', key: 'api_token', value: 'secret_token_123', isSecret: true, enabled: true },
        { id: 'vb3', key: 'prod_only', value: '1', isSecret: false, enabled: true },
      ],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const diff = compareEnvironments(sampleEnv, envB);
    const baseUrlDiff = diff.find((d) => d.key === 'base_url');
    expect(baseUrlDiff?.status).toBe('different');

    const tokenDiff = diff.find((d) => d.key === 'api_token');
    expect(tokenDiff?.status).toBe('identical');

    const prodOnlyDiff = diff.find((d) => d.key === 'prod_only');
    expect(prodOnlyDiff?.status).toBe('only_in_b');
  });

  it('exports .env.example with secret values masked by default', () => {
    const exported = exportDotEnvExample(sampleEnv, false);
    expect(exported).toContain('base_url=https://api.example.com');
    expect(exported).toContain('api_token=your_api_token_here');
    expect(exported).not.toContain('secret_token_123');
  });

  it('exports .env with secrets only when explicitly requested', () => {
    const exported = exportDotEnvExample(sampleEnv, true);
    expect(exported).toContain('api_token=secret_token_123');
  });
});

describe('cURL Parser and Generator', () => {
  it('parses cURL commands into structured ApiRequest fields', () => {
    const curlCommand = `curl -X POST "https://api.example.com/v1/users" \\
      -H "Content-Type: application/json" \\
      -H "Authorization: Bearer token123" \\
      -d '{"name":"John Doe","email":"john@example.com"}'`;

    const parsed = parseCurlToRequest(curlCommand);
    expect(parsed.method).toBe('POST');
    expect(parsed.url).toBe('https://api.example.com/v1/users');
    expect(parsed.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'Content-Type', value: 'application/json' }),
      ])
    );
    expect(parsed.auth).toEqual({ type: 'bearer', bearerToken: 'token123' });
    expect(parsed.body?.type).toBe('json');
    expect(parsed.body?.jsonContent).toContain('"name":"John Doe"');
  });

  it('generates executable cURL command from request structure', () => {
    const request: ApiRequest = {
      id: 'req-1',
      name: 'Test Request',
      method: 'POST',
      url: 'https://api.example.com/login',
      params: [{ id: 'p1', key: 'ref', value: 'web', enabled: true }],
      headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
      body: {
        type: 'json',
        rawText: '',
        jsonContent: '{"user":"test"}',
        formParams: [],
        multipartParams: [],
      },
      auth: { type: 'none' },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const curl = generateCurlCommand(request);
    expect(curl).toContain('curl -X POST "https://api.example.com/login?ref=web"');
    expect(curl).toContain('-H "Content-Type: application/json"');
    expect(curl).toContain("-d '{\"user\":\"test\"}'");
  });
});

describe('Security & Sensitive Data History Sanitization', () => {
  it('strictly strips auth credentials and masks authorization headers in history', () => {
    const sensitiveRequest: ApiRequest = {
      id: 'req-secret',
      name: 'Secret Request',
      method: 'POST',
      url: 'https://api.example.com/admin',
      params: [],
      headers: [
        { id: 'h1', key: 'Authorization', value: 'Bearer super_secret_jwt_token', enabled: true },
        { id: 'h2', key: 'X-API-Key', value: 'my_private_key', enabled: true },
        { id: 'h3', key: 'Accept', value: 'application/json', enabled: true },
      ],
      body: { type: 'none', rawText: '', jsonContent: '', formParams: [], multipartParams: [] },
      auth: {
        type: 'bearer',
        bearerToken: 'secret_bearer_token',
        basicUsername: 'admin',
        basicPassword: 'super_secret_password',
      },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const response: ApiResponse = {
      status: 200,
      statusText: 'OK',
      timeMs: 145,
      sizeBytes: 1024,
      headers: { 'content-type': 'application/json' },
      data: '{"success":true}',
      contentType: 'application/json',
      isError: false,
    };

    const historyItem = createSanitizedHistoryItem(sensitiveRequest, response);

    // Auth object MUST be completely omitted
    expect((historyItem.requestSnapshot as any).auth).toBeUndefined();

    // Authorization headers MUST be masked
    const authHeader = historyItem.requestSnapshot.headers.find((h) => h.key === 'Authorization');
    expect(authHeader?.value).toBe('••••••••••••');
    expect(authHeader?.value).not.toContain('super_secret_jwt_token');

    // Safe headers remain intact
    const acceptHeader = historyItem.requestSnapshot.headers.find((h) => h.key === 'Accept');
    expect(acceptHeader?.value).toBe('application/json');
  });

  it('builds resolved headers with API key or Bearer token', () => {
    const request: ApiRequest = {
      id: 'req-auth',
      name: 'Auth Request',
      method: 'GET',
      url: 'https://api.example.com',
      params: [],
      headers: [],
      body: { type: 'none', rawText: '', jsonContent: '', formParams: [], multipartParams: [] },
      auth: {
        type: 'bearer',
        bearerToken: 'my_token',
      },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const headers = buildResolvedHeaders(request);
    expect(headers['Authorization']).toBe('Bearer my_token');
  });

  it('builds resolved url with query params and environment variables', () => {
    const request: ApiRequest = {
      id: 'req-url-test',
      name: 'Url Test',
      method: 'GET',
      url: '{{base_url}}/items',
      params: [
        { id: 'p1', key: 'sort', value: 'desc', enabled: true },
        { id: 'p2', key: 'skip', value: '10', enabled: false },
      ],
      headers: [],
      body: { type: 'none', rawText: '', jsonContent: '', formParams: [], multipartParams: [] },
      auth: { type: 'none' },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const resolved = buildResolvedUrl(request, sampleEnv);
    expect(resolved).toBe('https://api.example.com/items?sort=desc');
  });
});

describe('Multi-language Code Generation', () => {
  const sampleRequest: ApiRequest = {
    id: 'req-codegen',
    name: 'Get Users',
    method: 'GET',
    url: 'https://api.example.com/users',
    params: [{ id: 'p1', key: 'limit', value: '10', enabled: true }],
    headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
    body: { type: 'none', rawText: '', jsonContent: '', formParams: [], multipartParams: [] },
    auth: { type: 'none' },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('generates JavaScript Fetch snippet', () => {
    const code = generateCodeSnippet('javascript-fetch', sampleRequest);
    expect(code).toContain('fetch("https://api.example.com/users?limit=10"');
    expect(code).toContain('"method": "GET"');
  });

  it('generates Python Requests snippet', () => {
    const code = generateCodeSnippet('python-requests', sampleRequest);
    expect(code).toContain('import requests');
    expect(code).toContain('requests.get(');
  });

  it('generates Go snippet', () => {
    const code = generateCodeSnippet('go', sampleRequest);
    expect(code).toContain('package main');
    expect(code).toContain('http.NewRequest("GET"');
  });
});

describe('Storage Migrations', () => {
  it('migrates legacy workspace schema to version 4 with Phase 2 collections and environments', () => {
    const legacyData: any = {
      tasks: [],
      snippets: [],
      projects: [],
      scratchpad: { content: 'test', updatedAt: 12345 },
      favorites: [],
      history: [],
      settings: { theme: 'dark' },
      version: 1,
    };

    const migrated = migrateWorkspaceData(legacyData);
    expect(migrated.version).toBe(4);
    expect(Array.isArray(migrated.apiCollections)).toBe(true);
    expect(Array.isArray(migrated.apiRequests)).toBe(true);
    expect(Array.isArray(migrated.environments)).toBe(true);
    expect(Array.isArray(migrated.webhookSessions)).toBe(true);
    expect(migrated.environments.length).toBeGreaterThan(0);
  });
});
