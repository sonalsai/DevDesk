import type { ApiCollection, ApiRequest, HttpMethod, KeyValueParam, BodyType, AuthType } from '../../types/api';

export interface PostmanImportResult {
  collection: ApiCollection;
  requests: ApiRequest[];
}

/**
 * Imports a Postman Collection v2.1 format JSON string
 */
export function importPostmanCollection(jsonStr: string): PostmanImportResult {
  const parsed = JSON.parse(jsonStr);

  if (!parsed || !parsed.info || !parsed.item) {
    throw new Error('Invalid Postman Collection: missing info or item field.');
  }

  const collectionId = `col-pm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const collectionName = parsed.info.name || 'Imported Postman Collection';
  const collectionDesc = typeof parsed.info.description === 'string'
    ? parsed.info.description
    : parsed.info.description?.content || 'Imported from Postman Collection v2.1';

  const requests: ApiRequest[] = [];

  function traverseItems(items: any[], folderPath = '') {
    for (const item of items) {
      if (item.item && Array.isArray(item.item)) {
        // It's a folder
        const nextFolder = folderPath ? `${folderPath} / ${item.name}` : item.name;
        traverseItems(item.item, nextFolder);
      } else if (item.request) {
        // It's a request
        const reqObj = item.request;
        const name = folderPath ? `[${folderPath}] ${item.name}` : item.name;

        // Method
        const method: HttpMethod = (reqObj.method || 'GET').toUpperCase() as HttpMethod;

        // URL
        let url = '';
        const params: KeyValueParam[] = [];

        if (typeof reqObj.url === 'string') {
          url = reqObj.url;
        } else if (reqObj.url && typeof reqObj.url === 'object') {
          url = reqObj.url.raw || '';
          if (Array.isArray(reqObj.url.query)) {
            reqObj.url.query.forEach((q: any, i: number) => {
              params.push({
                id: `p-pm-${i}-${Date.now()}`,
                key: q.key || '',
                value: q.value || '',
                enabled: !q.disabled,
              });
            });
          }
        }

        // Headers
        const headers: KeyValueParam[] = [];
        if (Array.isArray(reqObj.header)) {
          reqObj.header.forEach((h: any, i: number) => {
            headers.push({
              id: `h-pm-${i}-${Date.now()}`,
              key: h.key || '',
              value: h.value || '',
              enabled: !h.disabled,
            });
          });
        }

        // Body
        let bodyType: BodyType = 'none';
        let rawText = '';
        let jsonContent = '';
        const formParams: KeyValueParam[] = [];
        const multipartParams: KeyValueParam[] = [];

        if (reqObj.body) {
          const mode = reqObj.body.mode;
          if (mode === 'raw') {
            const raw = reqObj.body.raw || '';
            const isJson = headers.some((h) => h.key.toLowerCase() === 'content-type' && h.value.includes('json')) ||
              raw.trim().startsWith('{') || raw.trim().startsWith('[');

            if (isJson) {
              bodyType = 'json';
              jsonContent = raw;
            } else {
              bodyType = 'raw';
              rawText = raw;
            }
          } else if (mode === 'urlencoded' && Array.isArray(reqObj.body.urlencoded)) {
            bodyType = 'form-urlencoded';
            reqObj.body.urlencoded.forEach((f: any, i: number) => {
              formParams.push({
                id: `fp-pm-${i}`,
                key: f.key || '',
                value: f.value || '',
                enabled: !f.disabled,
              });
            });
          } else if (mode === 'formdata' && Array.isArray(reqObj.body.formdata)) {
            bodyType = 'multipart';
            reqObj.body.formdata.forEach((m: any, i: number) => {
              multipartParams.push({
                id: `mp-pm-${i}`,
                key: m.key || '',
                value: m.value || '',
                enabled: !m.disabled,
              });
            });
          }
        }

        // Auth
        let authType: AuthType = 'none';
        let bearerToken = '';
        let basicUsername = '';
        let basicPassword = '';

        if (reqObj.auth) {
          if (reqObj.auth.type === 'bearer' && Array.isArray(reqObj.auth.bearer)) {
            authType = 'bearer';
            const tok = reqObj.auth.bearer.find((b: any) => b.key === 'token');
            bearerToken = tok ? tok.value : '';
          } else if (reqObj.auth.type === 'basic' && Array.isArray(reqObj.auth.basic)) {
            authType = 'basic';
            const u = reqObj.auth.basic.find((b: any) => b.key === 'username');
            const p = reqObj.auth.basic.find((b: any) => b.key === 'password');
            basicUsername = u ? u.value : '';
            basicPassword = p ? p.value : '';
          }
        }

        const devdeskReq: ApiRequest = {
          id: `req-pm-${Date.now()}-${requests.length}`,
          collectionId,
          name,
          description: reqObj.description || '',
          method,
          url,
          params,
          headers,
          body: {
            type: bodyType,
            rawText,
            jsonContent,
            formParams,
            multipartParams,
          },
          auth: {
            type: authType,
            bearerToken,
            basicUsername,
            basicPassword,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        requests.push(devdeskReq);
      }
    }
  }

  traverseItems(parsed.item);

  const collection: ApiCollection = {
    id: collectionId,
    name: collectionName,
    description: collectionDesc,
    order: 0,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { collection, requests };
}

/**
 * Exports a DevDesk collection and its requests to standard Postman Collection v2.1 format
 */
export function exportToPostmanCollection(
  collection: ApiCollection,
  requests: ApiRequest[]
): object {
  const pmItems = requests.map((req) => {
    const item: any = {
      name: req.name,
      request: {
        method: req.method,
        header: req.headers.map((h) => ({
          key: h.key,
          value: h.value,
          disabled: !h.enabled,
        })),
        url: {
          raw: req.url,
          query: req.params.map((p) => ({
            key: p.key,
            value: p.value,
            disabled: !p.enabled,
          })),
        },
      },
    };

    if (req.description) {
      item.request.description = req.description;
    }

    // Body
    if (req.body.type === 'json') {
      item.request.body = {
        mode: 'raw',
        raw: req.body.jsonContent,
        options: { raw: { language: 'json' } },
      };
    } else if (req.body.type === 'raw') {
      item.request.body = {
        mode: 'raw',
        raw: req.body.rawText,
      };
    } else if (req.body.type === 'form-urlencoded') {
      item.request.body = {
        mode: 'urlencoded',
        urlencoded: req.body.formParams.map((p) => ({
          key: p.key,
          value: p.value,
          disabled: !p.enabled,
        })),
      };
    } else if (req.body.type === 'multipart') {
      item.request.body = {
        mode: 'formdata',
        formdata: req.body.multipartParams.map((p) => ({
          key: p.key,
          value: p.value,
          disabled: !p.enabled,
        })),
      };
    }

    // Auth
    if (req.auth.type === 'bearer' && req.auth.bearerToken) {
      item.request.auth = {
        type: 'bearer',
        bearer: [{ key: 'token', value: req.auth.bearerToken, type: 'string' }],
      };
    } else if (req.auth.type === 'basic') {
      item.request.auth = {
        type: 'basic',
        basic: [
          { key: 'username', value: req.auth.basicUsername || '', type: 'string' },
          { key: 'password', value: req.auth.basicPassword || '', type: 'string' },
        ],
      };
    }

    return item;
  });

  return {
    info: {
      name: collection.name,
      description: collection.description || 'Exported from DevDesk Developer Workspace',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _exporter_id: 'devdesk',
    },
    item: pmItems,
  };
}
