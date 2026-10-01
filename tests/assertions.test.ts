import { describe, it, expect } from 'vitest';
import {
  evaluateAssertion,
  evaluateAllAssertions,
  executeRequestExtractions,
  extractValueByJsonPath,
} from '../src/services/assertionRunner';
import type {
  ApiResponse,
  ApiAssertion,
  RequestExtractionRule,
  Environment,
} from '../src/types/api';

describe('Unit Test: API Assertions & Evaluator', () => {
  const mockResponse: ApiResponse = {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': 'req-abc-12345',
      'x-rate-limit-remaining': '99',
    },
    data: {
      user: {
        id: 101,
        name: 'Grace Hopper',
        active: true,
        roles: ['admin', 'maintainer'],
        settings: {
          notifications: true,
          theme: 'dark',
        },
      },
    },
    timeMs: 45,
    sizeBytes: 512,
  };

  describe('Status Code Assertions', () => {
    it('passes when status code matches expected value exactly', () => {
      const assertion: ApiAssertion = {
        id: 'ast-1',
        type: 'status_code',
        expected: '200',
        enabled: true,
      };
      const result = evaluateAssertion(assertion, mockResponse);
      expect(result.passed).toBe(true);
      expect(result.actual).toBe('200');
    });

    it('fails with informative message when status code does not match', () => {
      const assertion: ApiAssertion = {
        id: 'ast-2',
        type: 'status_code',
        expected: '404',
        enabled: true,
      };
      const result = evaluateAssertion(assertion, mockResponse);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Expected status 404 but received 200');
    });

    it('supports status_2xx assertion across 200-299 range', () => {
      const assertion: ApiAssertion = {
        id: 'ast-3',
        type: 'status_2xx',
        enabled: true,
      };
      expect(evaluateAssertion(assertion, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(assertion, { ...mockResponse, status: 201 }).passed).toBe(true);
      expect(evaluateAssertion(assertion, { ...mockResponse, status: 204 }).passed).toBe(true);
      expect(evaluateAssertion(assertion, { ...mockResponse, status: 400 }).passed).toBe(false);
      expect(evaluateAssertion(assertion, { ...mockResponse, status: 500 }).passed).toBe(false);
    });
  });

  describe('Response Time Assertions', () => {
    it('passes when response time is strictly within configured threshold', () => {
      const assertion: ApiAssertion = {
        id: 'ast-4',
        type: 'response_time',
        expected: '100',
        enabled: true,
      };
      const result = evaluateAssertion(assertion, mockResponse, 45);
      expect(result.passed).toBe(true);
      expect(result.message).toContain('Response received in 45ms');
    });

    it('fails when response time exceeds threshold', () => {
      const assertion: ApiAssertion = {
        id: 'ast-5',
        type: 'response_time',
        expected: '30',
        enabled: true,
      };
      const result = evaluateAssertion(assertion, mockResponse, 45);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('exceeding threshold');
    });
  });

  describe('Header Assertions', () => {
    it('checks header existence case-insensitively', () => {
      const passAssertion: ApiAssertion = {
        id: 'ast-6',
        type: 'header_exists',
        target: 'X-Request-Id',
        enabled: true,
      };
      const failAssertion: ApiAssertion = {
        id: 'ast-7',
        type: 'header_exists',
        target: 'X-Nonexistent-Header',
        enabled: true,
      };
      expect(evaluateAssertion(passAssertion, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(failAssertion, mockResponse).passed).toBe(false);
    });

    it('validates header value equality or substring match', () => {
      const assertion: ApiAssertion = {
        id: 'ast-8',
        type: 'header_equals',
        target: 'content-type',
        expected: 'application/json',
        enabled: true,
      };
      expect(evaluateAssertion(assertion, mockResponse).passed).toBe(true);
    });
  });

  describe('JSONPath & Body Assertions', () => {
    it('validates nested JSONPath existence without using eval()', () => {
      const path1: ApiAssertion = {
        id: 'ast-9',
        type: 'json_path_exists',
        target: '$.user.roles[0]',
        enabled: true,
      };
      const path2: ApiAssertion = {
        id: 'ast-10',
        type: 'json_path_exists',
        target: '$.user.settings.theme',
        enabled: true,
      };
      const invalidPath: ApiAssertion = {
        id: 'ast-11',
        type: 'json_path_exists',
        target: '$.user.nonexistentField',
        enabled: true,
      };

      expect(evaluateAssertion(path1, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(path2, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(invalidPath, mockResponse).passed).toBe(false);
    });

    it('validates JSONPath equality across number, boolean, and string values', () => {
      const numAssertion: ApiAssertion = {
        id: 'ast-12',
        type: 'json_path_equals',
        target: '$.user.id',
        expected: '101',
        enabled: true,
      };
      const boolAssertion: ApiAssertion = {
        id: 'ast-13',
        type: 'json_path_equals',
        target: '$.user.active',
        expected: 'true',
        enabled: true,
      };
      const strAssertion: ApiAssertion = {
        id: 'ast-14',
        type: 'json_path_equals',
        target: '$.user.name',
        expected: 'Grace Hopper',
        enabled: true,
      };

      expect(evaluateAssertion(numAssertion, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(boolAssertion, mockResponse).passed).toBe(true);
      expect(evaluateAssertion(strAssertion, mockResponse).passed).toBe(true);
    });

    it('evaluates body_contains correctly for string and structured data', () => {
      const assertion: ApiAssertion = {
        id: 'ast-15',
        type: 'body_contains',
        expected: 'Grace Hopper',
        enabled: true,
      };
      expect(evaluateAssertion(assertion, mockResponse).passed).toBe(true);
    });
  });

  describe('Batch Evaluation & Disabled Assertions', () => {
    it('evaluates multiple assertions and skips disabled rules safely', () => {
      const assertions: ApiAssertion[] = [
        { id: '1', type: 'status_code', expected: '200', enabled: true },
        { id: '2', type: 'status_code', expected: '404', enabled: false }, // disabled
      ];
      const results = evaluateAllAssertions(assertions, mockResponse);
      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(true);
      expect(results[1].message).toContain('skipped');
    });
  });

  describe('Request Chaining & Extraction Rules', () => {
    it('extracts tokens from response JSON into environment variables', () => {
      const response: ApiResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          auth: {
            accessToken: 'sec_token_99182',
            refreshToken: 'ref_token_11827',
          },
        },
        timeMs: 40,
        sizeBytes: 120,
      };

      const rules: RequestExtractionRule[] = [
        {
          id: 'rule-1',
          variableName: 'AUTH_BEARER',
          jsonPath: '$.auth.accessToken',
          enabled: true,
        },
      ];

      const activeEnv: Environment = {
        id: 'env-prod',
        name: 'Production',
        variables: [
          { id: 'v1', key: 'AUTH_BEARER', value: 'old_value', isSecret: true, enabled: true },
        ],
        createdAt: '',
        updatedAt: '',
      };

      const extracted = executeRequestExtractions(rules, response, activeEnv);
      expect(extracted['AUTH_BEARER']).toBe('sec_token_99182');
      expect(activeEnv.variables[0].value).toBe('sec_token_99182');
    });

    it('extractValueByJsonPath handles array bracket notation and object properties', () => {
      const data = {
        items: [
          { sku: 'SKU-001', price: 29.99 },
          { sku: 'SKU-002', price: 49.99 },
        ],
      };
      expect(extractValueByJsonPath(data, '$.items[0].sku')).toBe('SKU-001');
      expect(extractValueByJsonPath(data, '$.items[1].price')).toBe(49.99);
      expect(extractValueByJsonPath(data, '$.items[99]')).toBeUndefined();
    });
  });
});
