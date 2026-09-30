import type {
  ApiRequest,
  HttpMethod,
  KeyValueParam,
  RequestBody,
  AuthConfig,
  Environment,
} from '../types/api';
import { buildResolvedUrl, buildResolvedHeaders } from './apiExecutor';

/**
 * Parses a cURL command into an ApiRequest configuration.
 */
export function parseCurlToRequest(curlString: string): Partial<ApiRequest> {
  const cleanCmd = curlString.trim().replace(/\\\n/g, ' ').replace(/\\\r\n/g, ' ');
  if (!cleanCmd.toLowerCase().startsWith('curl')) {
    throw new Error('Not a valid cURL command. Must begin with "curl".');
  }

  // Tokenize preserving quotes
  const tokens: string[] = [];
  let currentToken = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < cleanCmd.length; i++) {
    const char = cleanCmd[i];

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (currentToken.length > 0) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else {
      currentToken += char;
    }
  }
  if (currentToken.length > 0) {
    tokens.push(currentToken);
  }

  let method: HttpMethod = 'GET';
  let url = '';
  const headers: KeyValueParam[] = [];
  let bodyContent = '';
  let auth: AuthConfig = { type: 'none' };

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    // Method flag: -X, --request
    if (token === '-X' || token === '--request') {
      const next = tokens[++i];
      if (next) method = next.toUpperCase() as HttpMethod;
    }
    // Header flag: -H, --header
    else if (token === '-H' || token === '--header') {
      const headerStr = tokens[++i];
      if (headerStr) {
        const colonIndex = headerStr.indexOf(':');
        if (colonIndex > -1) {
          const key = headerStr.substring(0, colonIndex).trim();
          const value = headerStr.substring(colonIndex + 1).trim();

          // Check if Authorization header
          if (key.toLowerCase() === 'authorization' && value.toLowerCase().startsWith('bearer ')) {
            auth = {
              type: 'bearer',
              bearerToken: value.substring(7).trim(),
            };
          } else if (key.toLowerCase() === 'authorization' && value.toLowerCase().startsWith('basic ')) {
            try {
              const decoded = atob(value.substring(6).trim());
              const [u, ...p] = decoded.split(':');
              auth = {
                type: 'basic',
                basicUsername: u,
                basicPassword: p.join(':'),
              };
            } catch {
              // fallback to regular header
              headers.push({
                id: `hdr-${Math.random().toString(36).substring(2, 6)}`,
                key,
                value,
                enabled: true,
              });
            }
          } else {
            headers.push({
              id: `hdr-${Math.random().toString(36).substring(2, 6)}`,
              key,
              value,
              enabled: true,
            });
          }
        }
      }
    }
    // Body / Data flags: -d, --data, --data-raw, --data-binary, --json
    else if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--json'
    ) {
      const dataStr = tokens[++i];
      if (dataStr) {
        bodyContent = dataStr;
        if (method === 'GET') method = 'POST';
      }
    }
    // Basic Auth flag: -u, --user
    else if (token === '-u' || token === '--user') {
      const userStr = tokens[++i];
      if (userStr) {
        const [u, ...p] = userStr.split(':');
        auth = {
          type: 'basic',
          basicUsername: u,
          basicPassword: p.join(':'),
        };
      }
    }
    // URL (argument that doesn't start with -)
    else if (!token.startsWith('-') && !url) {
      url = token.replace(/^['"]|['"]$/g, '');
    }
  }

  // Extract query parameters from URL into params table
  const params: KeyValueParam[] = [];
  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    parsedUrl.searchParams.forEach((value, key) => {
      params.push({
        id: `param-${Math.random().toString(36).substring(2, 6)}`,
        key,
        value,
        enabled: true,
      });
    });
  } catch {
    // Keep URL as-is
  }

  // Detect body type (JSON or Raw)
  let bodyType: RequestBody['type'] = 'none';
  let jsonContent = '';
  let rawText = '';

  if (bodyContent) {
    try {
      JSON.parse(bodyContent);
      bodyType = 'json';
      jsonContent = bodyContent;
    } catch {
      bodyType = 'raw';
      rawText = bodyContent;
    }
  }

  const body: RequestBody = {
    type: bodyType,
    jsonContent,
    rawText,
    formParams: [],
    multipartParams: [],
  };

  return {
    method,
    url,
    params,
    headers,
    body,
    auth,
  };
}

/**
 * Generates an executable cURL command line string.
 */
export function generateCurlCommand(request: ApiRequest, environment?: Environment): string {
  const url = buildResolvedUrl(request, environment);
  const headers = buildResolvedHeaders(request, environment);

  const lines: string[] = [`curl -X ${request.method} "${url || 'https://api.example.com'}"`];

  // Headers
  Object.entries(headers).forEach(([k, v]) => {
    lines.push(`  -H "${k}: ${v.replace(/"/g, '\\"')}"`);
  });

  // Body
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body.type !== 'none') {
    if (request.body.type === 'json' && request.body.jsonContent.trim()) {
      lines.push(`  -d '${request.body.jsonContent.replace(/'/g, "'\\''")}'`);
    } else if (request.body.type === 'raw' && request.body.rawText.trim()) {
      lines.push(`  -d '${request.body.rawText.replace(/'/g, "'\\''")}'`);
    } else if (request.body.type === 'form-urlencoded') {
      const dataParts = request.body.formParams
        .filter((p) => p.enabled && p.key.trim())
        .map(
          (p) =>
            `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`
        );
      if (dataParts.length > 0) {
        lines.push(`  -d "${dataParts.join('&')}"`);
      }
    }
  }

  return lines.join(' \\\n');
}
