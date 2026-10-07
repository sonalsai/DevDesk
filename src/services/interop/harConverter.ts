import type { ApiRequest, ApiHistoryItem, HttpMethod, KeyValueParam } from '../../types/api';

export interface HarImportResult {
  requests: ApiRequest[];
  importedCount: number;
}

/**
 * Imports a HTTP Archive (HAR 1.2) file exported from Chrome, Firefox, or Safari DevTools
 */
export function importHarArchive(harJsonStr: string, collectionId: string): HarImportResult {
  const parsed = JSON.parse(harJsonStr);

  if (!parsed || !parsed.log || !Array.isArray(parsed.log.entries)) {
    throw new Error('Invalid HAR archive: missing log.entries array.');
  }

  const entries = parsed.log.entries;
  const requests: ApiRequest[] = [];

  entries.forEach((entry: any, index: number) => {
    const harReq = entry.request;
    if (!harReq || !harReq.url) return;

    // Filter out standard static asset requests (images, css, js) to keep API list clean unless needed
    const urlObj = new URL(harReq.url, 'http://localhost');
    const path = urlObj.pathname;
    const isAsset = /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|css)$/i.test(path);
    if (isAsset) return;

    const method = (harReq.method || 'GET').toUpperCase() as HttpMethod;
    const name = `${method} ${path.split('/').pop() || path || '/'}`;

    // Params
    const params: KeyValueParam[] = [];
    if (Array.isArray(harReq.queryString)) {
      harReq.queryString.forEach((q: any, i: number) => {
        params.push({
          id: `hp-${index}-${i}`,
          key: q.name || '',
          value: q.value || '',
          enabled: true,
        });
      });
    }

    // Headers
    const headers: KeyValueParam[] = [];
    if (Array.isArray(harReq.headers)) {
      harReq.headers.forEach((h: any, i: number) => {
        // Exclude pseudo-headers like :method, :path
        if (h.name && !h.name.startsWith(':')) {
          headers.push({
            id: `hh-${index}-${i}`,
            key: h.name,
            value: h.value || '',
            enabled: true,
          });
        }
      });
    }

    // Body
    let bodyType: 'none' | 'json' | 'raw' | 'form-urlencoded' | 'multipart' = 'none';
    let jsonContent = '';
    let rawText = '';
    const formParams: KeyValueParam[] = [];

    if (harReq.postData) {
      const mime = (harReq.postData.mimeType || '').toLowerCase();
      const text = harReq.postData.text || '';

      if (mime.includes('json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        bodyType = 'json';
        jsonContent = text;
      } else if (mime.includes('urlencoded') && Array.isArray(harReq.postData.params)) {
        bodyType = 'form-urlencoded';
        harReq.postData.params.forEach((p: any, i: number) => {
          formParams.push({
            id: `hfp-${index}-${i}`,
            key: p.name || '',
            value: p.value || '',
            enabled: true,
          });
        });
      } else if (text) {
        bodyType = 'raw';
        rawText = text;
      }
    }

    const apiReq: ApiRequest = {
      id: `req-har-${Date.now()}-${index}`,
      collectionId,
      name,
      description: `Imported from HAR: ${harReq.url}`,
      method,
      url: harReq.url,
      params,
      headers,
      body: {
        type: bodyType,
        rawText,
        jsonContent,
        formParams,
        multipartParams: [],
      },
      auth: {
        type: 'none',
      },
      createdAt: entry.startedDateTime || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requests.push(apiReq);
  });

  return {
    requests,
    importedCount: requests.length,
  };
}

/**
 * Exports DevDesk requests & history to standard HAR 1.2 format
 */
export function exportToHarArchive(requests: ApiRequest[], historyItems?: ApiHistoryItem[]): object {
  const entries = requests.map((req) => {
    const hist = historyItems?.find((h) => h.url === req.url);

    return {
      startedDateTime: req.createdAt || new Date().toISOString(),
      time: hist?.timeMs || 0,
      request: {
        method: req.method,
        url: req.url,
        httpVersion: 'HTTP/1.1',
        headers: req.headers.map((h) => ({ name: h.key, value: h.value })),
        queryString: req.params.map((p) => ({ name: p.key, value: p.value })),
        headersSize: -1,
        bodySize: req.body.type === 'json' ? new Blob([req.body.jsonContent]).size : 0,
        postData:
          req.body.type === 'json'
            ? { mimeType: 'application/json', text: req.body.jsonContent }
            : req.body.type === 'raw'
            ? { mimeType: 'text/plain', text: req.body.rawText }
            : undefined,
      },
      response: {
        status: hist?.status || 200,
        statusText: hist?.statusText || 'OK',
        httpVersion: 'HTTP/1.1',
        headers: [],
        content: {
          size: hist?.sizeBytes || 0,
          mimeType: 'application/json',
        },
        headersSize: -1,
        bodySize: hist?.sizeBytes || 0,
      },
      cache: {},
      timings: {
        send: 0,
        wait: hist?.timeMs || 0,
        receive: 0,
      },
    };
  });

  return {
    log: {
      version: '1.2',
      creator: {
        name: 'DevDesk',
        version: '5.0',
      },
      entries,
    },
  };
}
