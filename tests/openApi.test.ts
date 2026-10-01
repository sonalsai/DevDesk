import { describe, it, expect } from 'vitest';
import {
  parseOpenApiSpec,
  generateCollectionFromSpec,
  mapServersToEnvironments,
} from '../src/services/openApiParser';

describe('Unit Test: OpenAPI & Swagger Specification Parser', () => {
  const openApi3Json = JSON.stringify({
    openapi: '3.0.1',
    info: {
      title: 'Customer Billing API',
      version: '2.1.0',
      description: 'API for processing customer invoices and charges',
    },
    servers: [
      { url: 'https://billing.company.com/v2', description: 'Production Gateway' },
      { url: 'https://staging.billing.company.com/v2', description: 'Staging Gateway' },
    ],
    paths: {
      '/invoices': {
        get: {
          summary: 'List Invoices',
          description: 'Retrieve paginated customer invoices',
          parameters: [
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer' }, example: 20 },
            { name: 'status', in: 'query', required: true, schema: { type: 'string' }, example: 'paid' },
          ],
          responses: {
            '200': { description: 'Successful invoice list' },
          },
        },
        post: {
          summary: 'Create Invoice',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    customerId: { type: 'string', example: 'cus_889' },
                    amount: { type: 'number', example: 120.5 },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Invoice successfully created' },
          },
        },
      },
      '/invoices/{invoiceId}': {
        delete: {
          summary: 'Void Invoice',
          parameters: [
            { name: 'invoiceId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '204': { description: 'Invoice voided' },
          },
        },
      },
    },
  });

  const openApi3Yaml = `
openapi: 3.1.0
info:
  title: Analytics Event Ingestion
  version: 1.0.0
servers:
  - url: https://telemetry.internal.net
paths:
  /events:
    post:
      summary: Ingest Telemetry Event
      responses:
        '200':
          description: Event accepted
`;

  describe('parseOpenApiSpec()', () => {
    it('parses valid OpenAPI 3.0 JSON specification', () => {
      const result = parseOpenApiSpec(openApi3Json);
      expect(result.errors).toHaveLength(0);
      expect(result.specification.title).toBe('Customer Billing API');
      expect(result.specification.version).toBe('2.1.0');
      expect(result.specification.servers).toHaveLength(2);
      expect(result.specification.operations).toHaveLength(3);
    });

    it('parses valid OpenAPI 3.1 YAML specification', () => {
      const result = parseOpenApiSpec(openApi3Yaml);
      expect(result.errors).toHaveLength(0);
      expect(result.specification.title).toBe('Analytics Event Ingestion');
      expect(result.specification.operations).toHaveLength(1);
      expect(result.specification.operations[0].method).toBe('POST');
      expect(result.specification.operations[0].path).toBe('/events');
    });

    it('rejects empty content with clear error', () => {
      const result = parseOpenApiSpec('');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('empty');
    });

    it('rejects documents missing required paths and root fields', () => {
      const result = parseOpenApiSpec('{"notAnOpenApi": true}');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('generateCollectionFromSpec()', () => {
    it('generates an ApiCollection with properly mapped ApiRequests', () => {
      const parsed = parseOpenApiSpec(openApi3Json);
      const generated = generateCollectionFromSpec(parsed.specification);

      expect(generated.collection.name).toBe('Customer Billing API');
      expect(generated.requests).toHaveLength(3);

      const getReq = generated.requests.find((r) => r.method === 'GET');
      expect(getReq).toBeDefined();
      expect(getReq?.url).toContain('{{base_url}}/invoices');
      expect(getReq?.params.length).toBeGreaterThan(0);

      const postReq = generated.requests.find((r) => r.method === 'POST');
      expect(postReq).toBeDefined();
      expect(postReq?.body.type).toBe('json');
    });
  });

  describe('mapServersToEnvironments()', () => {
    it('maps OpenAPI servers array into DevDesk environments with base_url', () => {
      const parsed = parseOpenApiSpec(openApi3Json);
      const envs = mapServersToEnvironments(parsed.specification);

      expect(envs).toHaveLength(2);
      expect(envs[0].name).toBe('Production Gateway');
      expect(envs[0].variables[0].key).toBe('base_url');
      expect(envs[0].variables[0].value).toBe('https://billing.company.com/v2');

      expect(envs[1].name).toBe('Staging Gateway');
      expect(envs[1].variables[0].value).toBe('https://staging.billing.company.com/v2');
    });
  });
});
