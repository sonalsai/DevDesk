import { describe, it, expect } from 'vitest';
import {
  normalizePath,
  matchMockRoute,
  executeMockSimulation,
  createMockRequestLog,
} from '../src/services/mockServer';
import type { MockEndpoint } from '../src/types/api';

describe('Unit Test: Local Mock Server & Route Matcher', () => {
  const testEndpoints: MockEndpoint[] = [
    {
      id: 'ep-users',
      name: 'List Users',
      method: 'GET',
      path: '/api/v1/users',
      enabled: true,
      scenarios: [
        {
          id: 'sc-users-200',
          name: '200 Success',
          status: 200,
          statusText: 'OK',
          body: JSON.stringify([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]),
          delayMs: 15,
          isDefault: true,
          contentType: 'application/json',
        },
        {
          id: 'sc-users-500',
          name: '500 Server Error',
          status: 500,
          statusText: 'Internal Server Error',
          body: JSON.stringify({ error: 'Database connection failed' }),
          delayMs: 10,
          isDefault: false,
          contentType: 'application/json',
        },
      ],
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'ep-user-detail',
      name: 'Get User By ID',
      method: 'GET',
      path: '/api/v1/users/:userId',
      enabled: true,
      scenarios: [
        {
          id: 'sc-detail-200',
          name: '200 User Found',
          status: 200,
          statusText: 'OK',
          body: JSON.stringify({ id: ':userId', name: 'User Details' }),
          delayMs: 10,
          isDefault: true,
          contentType: 'application/json',
        },
      ],
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'ep-create-user',
      name: 'Create User',
      method: 'POST',
      path: '/api/v1/users',
      enabled: true,
      scenarios: [
        {
          id: 'sc-create-201',
          name: '201 Created',
          status: 201,
          statusText: 'Created',
          body: JSON.stringify({ id: 3, name: 'Charlie', created: true }),
          delayMs: 20,
          isDefault: true,
          contentType: 'application/json',
        },
      ],
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'ep-disabled',
      name: 'Disabled Route',
      method: 'GET',
      path: '/api/v1/disabled',
      enabled: false,
      scenarios: [
        {
          id: 'sc-dis',
          name: '200 OK',
          status: 200,
          statusText: 'OK',
          body: '{}',
          delayMs: 0,
          isDefault: true,
          contentType: 'application/json',
        },
      ],
      createdAt: '',
      updatedAt: '',
    },
  ];

  describe('normalizePath()', () => {
    it('normalizes full URLs to root pathnames', () => {
      expect(normalizePath('https://api.example.com/api/v1/users?page=1&limit=10')).toBe('/api/v1/users');
      expect(normalizePath('http://localhost:3000/orders')).toBe('/orders');
    });

    it('strips query parameters and trailing slashes from relative paths', () => {
      expect(normalizePath('/api/v1/users/')).toBe('/api/v1/users');
      expect(normalizePath('/api/v1/users?filter=admin')).toBe('/api/v1/users');
      expect(normalizePath('')).toBe('/');
    });
  });

  describe('matchMockRoute()', () => {
    it('matches exact static routes and methods', () => {
      const match = matchMockRoute(testEndpoints, 'GET', '/api/v1/users');
      expect(match).not.toBeNull();
      expect(match?.endpoint.id).toBe('ep-users');
      expect(match?.scenario.status).toBe(200);
      expect(Object.keys(match?.pathParams || {})).toHaveLength(0);
    });

    it('distinguishes between HTTP methods on identical paths', () => {
      const getMatch = matchMockRoute(testEndpoints, 'GET', '/api/v1/users');
      const postMatch = matchMockRoute(testEndpoints, 'POST', '/api/v1/users');
      expect(getMatch?.endpoint.id).toBe('ep-users');
      expect(postMatch?.endpoint.id).toBe('ep-create-user');
    });

    it('matches parameterized routes and parses path parameters', () => {
      const match = matchMockRoute(testEndpoints, 'GET', '/api/v1/users/usr_982');
      expect(match).not.toBeNull();
      expect(match?.endpoint.id).toBe('ep-user-detail');
      expect(match?.pathParams['userId']).toBe('usr_982');
    });

    it('does not match disabled endpoints', () => {
      const match = matchMockRoute(testEndpoints, 'GET', '/api/v1/disabled');
      expect(match).toBeNull();
    });

    it('returns null when no route matches path length or segments', () => {
      expect(matchMockRoute(testEndpoints, 'GET', '/api/v1/users/extra/segments')).toBeNull();
      expect(matchMockRoute(testEndpoints, 'GET', '/api/v1/unknown')).toBeNull();
    });
  });

  describe('executeMockSimulation()', () => {
    it('executes matched route simulation in-browser with mock headers', async () => {
      const result = await executeMockSimulation('GET', '/api/v1/users', {}, '', testEndpoints);
      expect(result.status).toBe(200);
      expect(result.matchedEndpoint?.id).toBe('ep-users');
      expect(result.headers['x-devdesk-mock']).toBe('true');
      expect(result.body).toContain('Alice');
    });

    it('returns a clean 404 response for unmatched simulation routes', async () => {
      const result = await executeMockSimulation('DELETE', '/api/v1/missing', {}, '', testEndpoints);
      expect(result.status).toBe(404);
      expect(result.statusText).toBe('Not Found');
      expect(result.matchedEndpoint).toBeNull();
      expect(result.body).toContain('Route not matched');
    });
  });

  describe('createMockRequestLog()', () => {
    it('creates structured, safe request audit log records', () => {
      const log = createMockRequestLog(
        'GET',
        '/api/v1/users',
        200,
        18,
        { 'content-type': 'application/json' },
        { page: '1' },
        '{}',
        'ep-users'
      );
      expect(log.id).toBeDefined();
      expect(log.method).toBe('GET');
      expect(log.path).toBe('/api/v1/users');
      expect(log.status).toBe(200);
      expect(log.timeMs).toBe(18);
      expect(log.endpointId).toBe('ep-users');
    });
  });
});
