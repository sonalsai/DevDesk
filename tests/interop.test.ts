import { describe, it, expect } from 'vitest';
import { resolveDynamicVariable, DYNAMIC_SYSTEM_VARIABLES } from '../src/services/dynamicVariables';
import { interpolateVariables } from '../src/services/environmentService';
import { importPostmanCollection, exportToPostmanCollection } from '../src/services/interop/postmanConverter';
import { importHarArchive, exportToHarArchive } from '../src/services/interop/harConverter';
import type { ApiCollection, ApiRequest } from '../src/types/api';

describe('Global API Interoperability & Dynamic Variables', () => {
  describe('Dynamic System Variables Engine', () => {
    it('defines standard system macros', () => {
      expect(DYNAMIC_SYSTEM_VARIABLES.length).toBeGreaterThanOrEqual(8);
      const keys = DYNAMIC_SYSTEM_VARIABLES.map((v) => v.key);
      expect(keys).toContain('$guid');
      expect(keys).toContain('$timestamp');
      expect(keys).toContain('$isoTimestamp');
      expect(keys).toContain('$randomEmail');
    });

    it('resolves $guid to a valid UUID v4 format', () => {
      const guid = resolveDynamicVariable('$guid');
      expect(guid).not.toBeNull();
      expect(guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('resolves $timestamp to a numeric timestamp in seconds', () => {
      const ts = resolveDynamicVariable('$timestamp');
      expect(ts).not.toBeNull();
      const num = parseInt(ts!, 10);
      expect(num).toBeGreaterThan(1600000000);
    });

    it('resolves $isoTimestamp to an ISO 8601 string', () => {
      const iso = resolveDynamicVariable('$isoTimestamp');
      expect(iso).not.toBeNull();
      expect(new Date(iso!).toISOString()).toBe(iso);
    });

    it('resolves $randomEmail with developer prefix and valid domain', () => {
      const email = resolveDynamicVariable('$randomEmail');
      expect(email).not.toBeNull();
      expect(email).toMatch(/^engineer\.[a-z0-9]+@devdesk\.local$/);
    });

    it('interpolates dynamic variables inside template strings', () => {
      const template = 'https://api.example.com/items/{{$guid}}?time={{$timestamp}}';
      const resolved = interpolateVariables(template);
      expect(resolved).not.toContain('{{$guid}}');
      expect(resolved).not.toContain('{{$timestamp}}');
      expect(resolved).toContain('https://api.example.com/items/');
      expect(resolved).toContain('?time=');
    });
  });

  describe('Postman Collection v2.1 Interop', () => {
    it('imports Postman v2.1 collection format correctly', () => {
      const samplePostman = {
        info: {
          name: 'Stripe Payments Mock API',
          description: 'Payment intents and customers',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'Create Customer',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'alex@example.com', name: 'Alex' }),
              },
              url: {
                raw: 'https://api.stripe.com/v1/customers',
                query: [{ key: 'limit', value: '10' }],
              },
            },
          },
          {
            name: 'Get Invoices',
            request: {
              method: 'GET',
              header: [{ key: 'Accept', value: 'application/json' }],
              url: 'https://api.stripe.com/v1/invoices',
              auth: {
                type: 'bearer',
                bearer: [{ key: 'token', value: 'sk_test_12345' }],
              },
            },
          },
        ],
      };

      const result = importPostmanCollection(JSON.stringify(samplePostman));
      expect(result.collection.name).toBe('Stripe Payments Mock API');
      expect(result.requests).toHaveLength(2);

      const req1 = result.requests[0];
      expect(req1.name).toBe('Create Customer');
      expect(req1.method).toBe('POST');
      expect(req1.body.type).toBe('json');
      expect(req1.params).toHaveLength(1);
      expect(req1.params[0].key).toBe('limit');

      const req2 = result.requests[1];
      expect(req2.name).toBe('Get Invoices');
      expect(req2.method).toBe('GET');
      expect(req2.auth.type).toBe('bearer');
      expect(req2.auth.bearerToken).toBe('sk_test_12345');
    });

    it('exports DevDesk collection to Postman v2.1 format', () => {
      const collection: ApiCollection = {
        id: 'col-test',
        name: 'GitHub REST API',
        description: 'GitHub repositories and issues',
        order: 0,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const requests: ApiRequest[] = [
        {
          id: 'req-1',
          collectionId: 'col-test',
          name: 'Get User Repos',
          method: 'GET',
          url: 'https://api.github.com/user/repos',
          params: [{ id: 'p1', key: 'sort', value: 'updated', enabled: true }],
          headers: [{ id: 'h1', key: 'Accept', value: 'application/vnd.github.v3+json', enabled: true }],
          body: { type: 'none', rawText: '', jsonContent: '', formParams: [], multipartParams: [] },
          auth: { type: 'bearer', bearerToken: 'ghp_secretToken' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const exported: any = exportToPostmanCollection(collection, requests);
      expect(exported.info.name).toBe('GitHub REST API');
      expect(exported.info.schema).toContain('schema.getpostman.com/json/collection/v2.1.0');
      expect(exported.item).toHaveLength(1);
      expect(exported.item[0].name).toBe('Get User Repos');
      expect(exported.item[0].request.method).toBe('GET');
      expect(exported.item[0].request.auth.type).toBe('bearer');
      expect(exported.item[0].request.auth.bearer[0].value).toBe('ghp_secretToken');
    });
  });

  describe('HAR (HTTP Archive 1.2) Interop', () => {
    it('imports HAR network entries into DevDesk requests', () => {
      const sampleHar = {
        log: {
          version: '1.2',
          creator: { name: 'Chrome DevTools', version: '124' },
          entries: [
            {
              startedDateTime: '2026-10-06T10:00:00.000Z',
              time: 145,
              request: {
                method: 'POST',
                url: 'https://api.example.com/orders',
                headers: [{ name: 'Content-Type', value: 'application/json' }],
                queryString: [{ name: 'notify', value: 'true' }],
                postData: {
                  mimeType: 'application/json',
                  text: '{"orderId":"123"}',
                },
              },
            },
          ],
        },
      };

      const result = importHarArchive(JSON.stringify(sampleHar), 'col-har-test');
      expect(result.importedCount).toBe(1);
      expect(result.requests[0].method).toBe('POST');
      expect(result.requests[0].url).toBe('https://api.example.com/orders');
      expect(result.requests[0].body.type).toBe('json');
      expect(result.requests[0].params[0].key).toBe('notify');
    });

    it('exports requests to HAR 1.2 structure', () => {
      const requests: ApiRequest[] = [
        {
          id: 'req-har',
          collectionId: 'col-1',
          name: 'Health Check',
          method: 'GET',
          url: 'https://api.example.com/health',
          params: [],
          headers: [{ id: 'h1', key: 'User-Agent', value: 'DevDesk/5.0', enabled: true }],
          body: { type: 'none', rawText: '', jsonContent: '', formParams: [], multipartParams: [] },
          auth: { type: 'none' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const exported: any = exportToHarArchive(requests);
      expect(exported.log.version).toBe('1.2');
      expect(exported.log.creator.name).toBe('DevDesk');
      expect(exported.log.entries).toHaveLength(1);
      expect(exported.log.entries[0].request.url).toBe('https://api.example.com/health');
    });
  });
});
