import { describe, it, expect, vi } from 'vitest';
import {
  evaluateAssertion,
  evaluateAllAssertions,
  executeRequestExtractions,
  extractValueByJsonPath,
} from '../src/services/assertionRunner';
import {
  matchMockRoute,
  executeMockSimulation,
  createMockRequestLog,
  normalizePath,
} from '../src/services/mockServer';
import {
  parseOpenApiSpec,
  generateCollectionFromSpec,
  mapServersToEnvironments,
} from '../src/services/openApiParser';
import {
  buildQueryForField,
} from '../src/services/graphqlExecutor';
import { WebSocketManager } from '../src/services/webSocketManager';
import { SseManager } from '../src/services/sseManager';
import type {
  ApiResponse,
  ApiAssertion,
  RequestExtractionRule,
  MockEndpoint,
  Environment,
} from '../src/types/api';

describe('Phase 3: Real-Time API & Backend Development Platform Tests', () => {
  // =========================================================================
  // 1. API Assertions & Testing Foundations
  // =========================================================================
  describe('API Testing & Assertions Evaluator', () => {
    const mockResponse: ApiResponse = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-request-id': 'req-98765',
      },
      data: {
        user: {
          id: 42,
          name: 'Ada Lovelace',
          active: true,
          roles: ['admin', 'engineer'],
          meta: {
            score: 99.5,
          },
        },
      },
      time: 85,
      size: 420,
    };

    it('evaluates status_equals assertion correctly', () => {
      const passAssertion: ApiAssertion = {
        id: 'a1',
        type: 'status_equals',
        expectedValue: '200',
        enabled: true,
      };
      const failAssertion: ApiAssertion = {
        id: 'a2',
        type: 'status_equals',
        expectedValue: '404',
        enabled: true,
      };

      expect(evaluateAssertion(passAssertion, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(failAssertion, mockResponse).passed).toBe(false);
    });

    it('evaluates status_range_2xx assertion', () => {
      const assertion: ApiAssertion = {
        id: 'a3',
        type: 'status_range_2xx',
        enabled: true,
      };
      expect(evaluateAssertion(assertion, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(assertion, { ...mockResponse, status: 500 }).passed).toBe(false);
    });

    it('evaluates header_exists and header_equals assertions (case-insensitive)', () => {
      const existsAssertion: ApiAssertion = {
        id: 'a4',
        type: 'header_exists',
        property: 'X-Request-Id',
        enabled: true,
      };
      const equalsAssertion: ApiAssertion = {
        id: 'a5',
        type: 'header_equals',
        property: 'Content-Type',
        expectedValue: 'application/json; charset=utf-8',
        enabled: true,
      };

      expect(evaluateAssertion(existsAssertion, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(equalsAssertion, mockResponse).passed).toBe(true);
    });

    it('evaluates json_path_exists and json_path_equals recursively without eval()', () => {
      const pathExists: ApiAssertion = {
        id: 'a6',
        type: 'json_path_exists',
        property: '$.user.roles[1]',
        enabled: true,
      };
      const pathEqualsNumber: ApiAssertion = {
        id: 'a7',
        type: 'json_path_equals',
        property: '$.user.id',
        expectedValue: '42',
        enabled: true,
      };
      const pathEqualsBoolean: ApiAssertion = {
        id: 'a8',
        type: 'json_path_equals',
        property: '$.user.active',
        expectedValue: 'true',
        enabled: true,
      };
      const pathEqualsString: ApiAssertion = {
        id: 'a9',
        type: 'json_path_equals',
        property: '$.user.name',
        expectedValue: 'Ada Lovelace',
        enabled: true,
      };

      expect(evaluateAssertion(pathExists, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(pathEqualsNumber, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(pathEqualsBoolean, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(pathEqualsString, mockResponse).passed).toBe(true);
    });

    it('evaluates response_time_less_than assertion', () => {
      const passTime: ApiAssertion = {
        id: 'a10',
        type: 'response_time_less_than',
        expectedValue: '100',
        enabled: true,
      };
      const failTime: ApiAssertion = {
        id: 'a11',
        type: 'response_time_less_than',
        expectedValue: '50',
        enabled: true,
      };

      expect(evaluateAssertion(passTime, mockResponse, 85).passed).toBe(true);
      expect(evaluateAssertion(failTime, mockResponse, 85).passed).toBe(false);
    });

    it('evaluates body_contains assertion', () => {
      const assertion: ApiAssertion = {
        id: 'a12',
        type: 'body_contains',
        expectedValue: 'Ada Lovelace',
        enabled: true,
      };
      expect(evaluateAssertion(assertion, mockResponse).passed).toBe(true);
    });

    it('runs batch assertions and skips disabled assertions safely', () => {
      const assertions: ApiAssertion[] = [
        { id: '1', type: 'status_equals', expectedValue: '200', enabled: true },
        { id: '2', type: 'status_equals', expectedValue: '500', enabled: false },
      ];
      const results = evaluateAllAssertions(assertions, mockResponse);
      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(true);
      expect(results[1].message).toContain('skipped');
    });
  });

  // =========================================================================
  // 2. Request Chaining & Variable Extraction
  // =========================================================================
  describe('Request Chaining Foundation', () => {
    it('safely extracts tokens and parameters using JSONPath into active environment', () => {
      const response: ApiResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          auth: {
            accessToken: 'jwt-sec-xyz-789',
            expiresIn: 3600,
          },
        },
        time: 50,
        size: 100,
      };

      const rules: RequestExtractionRule[] = [
        {
          id: 'r1',
          variableName: 'AUTH_TOKEN',
          jsonPath: '$.auth.accessToken',
          enabled: true,
        },
      ];

      const env: Environment = {
        id: 'env-1',
        name: 'Staging',
        variables: [
          { id: 'v1', key: 'AUTH_TOKEN', value: 'old-token', isSecret: true, enabled: true },
        ],
        createdAt: '',
        updatedAt: '',
      };

      const extracted = executeRequestExtractions(rules, response, env);
      expect(extracted['AUTH_TOKEN']).toBe('jwt-sec-xyz-789');
      expect(env.variables[0].value).toBe('jwt-sec-xyz-789');
    });

    it('handles bracket notation and array indexing in JSONPath', () => {
      const data = {
        store: {
          books: [
            { title: 'The Hobbit', price: 10.99 },
            { title: '1984', price: 8.99 },
          ],
        },
      };
      expect(extractValueByJsonPath(data, '$.store.books[0].title')).toBe('The Hobbit');
      expect(extractValueByJsonPath(data, '$.store.books[1].price')).toBe(8.99);
      expect(extractValueByJsonPath(data, '$.store.nonexistent')).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. Local Mock Server
  // =========================================================================
  describe('Local Mock Server & Route Matching', () => {
    const mockEndpoints: MockEndpoint[] = [
      {
        id: 'm1',
        name: 'Get Users List',
        method: 'GET',
        path: '/api/v1/users',
        enabled: true,
        scenarios: [
          {
            id: 's1',
            name: '200 Success',
            status: 200,
            statusText: 'OK',
            body: JSON.stringify([{ id: 1, name: 'Alice' }]),
            delayMs: 10,
            isDefault: true,
            contentType: 'application/json',
          },
        ],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'm2',
        name: 'Get User By ID',
        method: 'GET',
        path: '/api/v1/users/:id',
        enabled: true,
        scenarios: [
          {
            id: 's2',
            name: '200 User Details',
            status: 200,
            statusText: 'OK',
            body: JSON.stringify({ id: ':id', name: 'Bob' }),
            delayMs: 5,
            isDefault: true,
            contentType: 'application/json',
          },
        ],
        createdAt: '',
        updatedAt: '',
      },
    ];

    it('matches static routes accurately', () => {
      const match = matchMockRoute(mockEndpoints, 'GET', '/api/v1/users');
      expect(match).not.toBeNull();
      expect(match?.endpoint.id).toBe('m1');
      expect(match?.scenario.status).toBe(200);
    });

    it('matches parameterized routes and extracts path params', () => {
      const match = matchMockRoute(mockEndpoints, 'GET', '/api/v1/users/42');
      expect(match).not.toBeNull();
      expect(match?.endpoint.id).toBe('m2');
      expect(match?.pathParams['id']).toBe('42');
    });

    it('normalizes URLs and paths correctly', () => {
      expect(normalizePath('https://api.example.com/api/v1/users?filter=true')).toBe('/api/v1/users');
      expect(normalizePath('/users/')).toBe('/users');
    });

    it('executes simulated mock responses without external networking', async () => {
      const result = await executeMockSimulation('GET', '/api/v1/users', {}, '', mockEndpoints);
      expect(result.status).toBe(200);
      expect(result.matchedEndpoint?.id).toBe('m1');
      expect(result.headers['x-devdesk-mock']).toBe('true');
    });

    it('returns clean 404 for unmatched routes in simulation', async () => {
      const result = await executeMockSimulation('POST', '/api/unknown', {}, '', mockEndpoints);
      expect(result.status).toBe(404);
      expect(result.matchedEndpoint).toBeNull();
    });

    it('creates structured mock request logs', () => {
      const log = createMockRequestLog('GET', '/users', 200, 15, { 'content-type': 'application/json' }, {}, '');
      expect(log.id).toBeDefined();
      expect(log.status).toBe(200);
      expect(log.method).toBe('GET');
    });
  });

  // =========================================================================
  // 4. OpenAPI / Swagger Parser
  // =========================================================================
  describe('OpenAPI / Swagger 3.0 & 3.1 Parser', () => {
    const sampleOpenApiJson = JSON.stringify({
      openapi: '3.0.3',
      info: {
        title: 'Pet Store API',
        version: '1.2.0',
        description: 'Sample Pet Store API specification for testing',
      },
      servers: [
        { url: 'https://api.petstore.io/v1', description: 'Production' },
        { url: 'http://localhost:8080/v1', description: 'Local Dev' },
      ],
      paths: {
        '/pets': {
          get: {
            summary: 'List Pets',
            description: 'Returns all pets',
            parameters: [
              { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
            ],
            responses: {
              '200': { description: 'Successful response' },
            },
          },
          post: {
            summary: 'Create Pet',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Fido' },
                    },
                  },
                },
              },
            },
            responses: {
              '201': { description: 'Created' },
            },
          },
        },
      },
    });

    const sampleOpenApiYaml = `
openapi: 3.1.0
info:
  title: Orders Service
  version: 2.0.0
servers:
  - url: https://orders.company.internal
paths:
  /orders/{orderId}:
    get:
      summary: Get Order Details
      parameters:
        - name: orderId
          in: path
          required: true
      responses:
        '200':
          description: Order details
`;

    it('parses valid OpenAPI 3.0 JSON specification', () => {
      const res = parseOpenApiSpec(sampleOpenApiJson);
      expect(res.errors).toHaveLength(0);
      expect(res.specification.title).toBe('Pet Store API');
      expect(res.specification.version).toBe('1.2.0');
      expect(res.specification.servers).toHaveLength(2);
      expect(res.specification.operations).toHaveLength(2);
    });

    it('parses valid OpenAPI 3.1 YAML specification', () => {
      const res = parseOpenApiSpec(sampleOpenApiYaml);
      expect(res.errors).toHaveLength(0);
      expect(res.specification.title).toBe('Orders Service');
      expect(res.specification.version).toBe('2.0.0');
      expect(res.specification.operations).toHaveLength(1);
      expect(res.specification.operations[0].method).toBe('GET');
    });

    it('generates collections and requests from parsed specification', () => {
      const res = parseOpenApiSpec(sampleOpenApiJson);
      const generated = generateCollectionFromSpec(res.specification);

      expect(generated.collection.name).toBe('Pet Store API');
      expect(generated.requests).toHaveLength(2);
      expect(generated.requests[0].name).toBe('List Pets');
      expect(generated.requests[0].method).toBe('GET');
      expect(generated.requests[0].url).toContain('{{base_url}}/pets');
      expect(generated.requests[1].name).toBe('Create Pet');
      expect(generated.requests[1].method).toBe('POST');
    });

    it('maps OpenAPI servers into DevDesk environments', () => {
      const res = parseOpenApiSpec(sampleOpenApiJson);
      const envs = mapServersToEnvironments(res.specification);

      expect(envs).toHaveLength(2);
      expect(envs[0].name).toBe('Production');
      expect(envs[0].variables[0].key).toBe('base_url');
      expect(envs[0].variables[0].value).toBe('https://api.petstore.io/v1');
    });

    it('handles malformed specifications with meaningful error reporting', () => {
      const invalidJson = '{ openapi: "3.0.0", invalid JSON }';
      const res = parseOpenApiSpec(invalidJson);
      expect(res.errors.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 5. GraphQL Query Builder
  // =========================================================================
  describe('GraphQL Schema Query Builder', () => {
    it('builds query fragments for object types with subfields', () => {
      const field = {
        name: 'users',
        type: '[User]',
        args: [],
      };
      const types = [
        {
          name: 'User',
          kind: 'OBJECT',
          fields: [
            { name: 'id', type: 'ID!', args: [] },
            { name: 'name', type: 'String', args: [] },
            { name: 'email', type: 'String', args: [] },
          ],
        },
      ];

      const fragment = buildQueryForField(field, types);
      expect(fragment).toContain('users {');
      expect(fragment).toContain('id');
      expect(fragment).toContain('name');
    });

    it('builds scalar field selection directly', () => {
      const scalarField = {
        name: 'ping',
        type: 'String',
        args: [],
      };
      const fragment = buildQueryForField(scalarField, []);
      expect(fragment).toBe('ping');
    });
  });

  // =========================================================================
  // 6. WebSocket & SSE Managers
  // =========================================================================
  describe('WebSocket and SSE Managers Lifecycle', () => {
    it('WebSocketManager validates protocol and refuses non-ws URLs', () => {
      const onStatus = vi.fn();
      const onMsg = vi.fn();
      const wsManager = new WebSocketManager({ onStatusChange: onStatus, onMessage: onMsg });

      wsManager.connect('http://invalid-url.com');
      expect(onStatus).toHaveBeenCalledWith('error', expect.stringContaining('ws:// or wss://'));
    });

    it('SseManager validates protocol and refuses non-http URLs', () => {
      const onStatus = vi.fn();
      const onEvent = vi.fn();
      const sse = new SseManager({ onStatusChange: onStatus, onEvent: onEvent });

      sse.connect('ws://invalid-sse-url.com');
      expect(onStatus).toHaveBeenCalledWith('error', expect.stringContaining('http:// or https://'));
    });

    it('WebSocketManager supports multiple subscriber listeners and unsubscription', () => {
      const manager = new WebSocketManager();
      const sub1 = vi.fn();
      const sub2 = vi.fn();

      const unsub1 = manager.onMessage(sub1);
      const unsub2 = manager.onMessage(sub2);

      // Trigger disconnect/connect error
      manager.connect('invalid');
      expect(sub1).toHaveBeenCalled();
      expect(sub2).toHaveBeenCalled();

      // Unsubscribe sub1
      unsub1();
      sub1.mockClear();
      sub2.mockClear();

      manager.connect('invalid');
      expect(sub1).not.toHaveBeenCalled();
      expect(sub2).toHaveBeenCalled();

      unsub2();
    });
  });
});
