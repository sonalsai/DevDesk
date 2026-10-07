import YAML from 'yaml';
import type {
  HttpMethod,
  ApiCollection,
  ApiRequest,
  Environment,
  KeyValueParam,
  OpenApiSpecification,
  OpenApiOperation,
} from '../../types/api';

export interface OpenApiParseResult {
  specification: OpenApiSpecification;
  warnings: string[];
  errors: string[];
}

/**
 * Parses raw JSON or YAML text into a standard OpenAPI 3.0 / 3.1 specification object.
 */
export function parseOpenApiDocument(rawContent: string): OpenApiParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!rawContent || !rawContent.trim()) {
    return {
      specification: createEmptySpec(),
      warnings,
      errors: ['Specification content is empty'],
    };
  }

  let doc: any = null;

  // Try JSON first, fallback to YAML
  try {
    doc = JSON.parse(rawContent);
  } catch {
    try {
      doc = YAML.parse(rawContent);
    } catch (yamlErr: any) {
      return {
        specification: createEmptySpec(),
        warnings,
        errors: [`Failed to parse document as JSON or YAML: ${yamlErr.message}`],
      };
    }
  }

  if (!doc || typeof doc !== 'object') {
    return {
      specification: createEmptySpec(),
      warnings,
      errors: ['Document root must be a valid JSON or YAML object'],
    };
  }

  // Version check (OpenAPI 3.0.x / 3.1.x or Swagger 2.0)
  const openapiVersion = doc.openapi || doc.swagger;
  if (!openapiVersion && !doc.paths) {
    return {
      specification: createEmptySpec(),
      warnings,
      errors: ['Document does not contain valid OpenAPI/Swagger root fields ("openapi"/"swagger" or "paths")'],
    };
  }
  if (!openapiVersion) {
    warnings.push('Document does not declare an "openapi" or "swagger" version string. Assuming OpenAPI 3.0.');
  }

  if (!doc.paths || typeof doc.paths !== 'object') {
    errors.push('Document is missing required "paths" definition object');
  }

  if (errors.length > 0) {
    return {
      specification: createEmptySpec(),
      warnings,
      errors,
    };
  }

  const title = doc.info?.title || 'Imported API';
  const version = doc.info?.version || '1.0.0';
  const description = doc.info?.description || '';

  // Extract Servers
  const servers: Array<{ url: string; description?: string }> = [];
  if (Array.isArray(doc.servers)) {
    doc.servers.forEach((s: any) => {
      if (s?.url) {
        servers.push({
          url: s.url,
          description: s.description,
        });
      }
    });
  } else if (doc.host) {
    // Swagger 2.0 fallback
    const scheme = doc.schemes?.[0] || 'https';
    servers.push({
      url: `${scheme}://${doc.host}${doc.basePath || ''}`,
      description: 'Host from Swagger 2.0',
    });
  }

  if (servers.length === 0) {
    servers.push({ url: 'https://api.example.com', description: 'Default fallback host' });
    warnings.push('No servers were defined in the document. Added fallback server "https://api.example.com".');
  }

  // Extract Tags
  const tags: Array<{ name: string; description?: string }> = [];
  if (Array.isArray(doc.tags)) {
    doc.tags.forEach((t: any) => {
      if (t?.name) {
        tags.push({ name: t.name, description: t.description });
      }
    });
  }

  // Extract Operations from Paths
  const operations: OpenApiOperation[] = [];
  const paths = doc.paths || {};

  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  Object.keys(paths).forEach((path) => {
    const pathItem = paths[path];
    if (!pathItem || typeof pathItem !== 'object') return;

    validMethods.forEach((method) => {
      const op = pathItem[method.toLowerCase()];
      if (op && typeof op === 'object') {
        const opTags = Array.isArray(op.tags) ? op.tags : ['Default'];
        const parameters: OpenApiOperation['parameters'] = [];

        // Combined parameters (path-level + operation-level)
        const rawParams = [...(pathItem.parameters || []), ...(op.parameters || [])];
        rawParams.forEach((p: any) => {
          if (p?.name && p?.in) {
            parameters.push({
              name: p.name,
              in: p.in,
              required: !!p.required,
              description: p.description,
              schema: p.schema,
              example: p.example,
            });
          }
        });

        operations.push({
          id: op.operationId || `op-${method.toLowerCase()}-${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
          path,
          method,
          operationId: op.operationId,
          summary: op.summary || `${method} ${path}`,
          description: op.description || '',
          tags: opTags,
          parameters,
          requestBody: op.requestBody,
          responses: op.responses || {},
          security: op.security || doc.security,
        });
      }
    });
  });

  if (operations.length === 0) {
    warnings.push('No valid HTTP operations found in the "paths" object.');
  }

  const schemas = doc.components?.schemas || doc.definitions || {};
  const securitySchemes = doc.components?.securitySchemes || doc.securityDefinitions || {};

  return {
    specification: {
      openapiVersion: openapiVersion || '3.0.0',
      title,
      version,
      description,
      servers,
      tags,
      operations,
      schemas,
      securitySchemes,
      rawSpec: doc,
    },
    warnings,
    errors,
  };
}

function createEmptySpec(): OpenApiSpecification {
  return {
    openapiVersion: '3.0.0',
    title: 'Empty Specification',
    version: '1.0.0',
    description: '',
    servers: [],
    tags: [],
    operations: [],
    schemas: {},
    securitySchemes: {},
  };
}

/**
 * Converts a parsed OpenAPI specification into a DevDesk ApiCollection and associated ApiRequests.
 */
export function generateCollectionFromOpenApi(
  spec: OpenApiSpecification,
  collectionName?: string
): {
  collection: ApiCollection;
  requests: ApiRequest[];
  environments: Environment[];
} {
  const collectionId = `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const collection: ApiCollection = {
    id: collectionId,
    name: collectionName || spec.title || 'Imported API',
    description: spec.description || `Generated from OpenAPI ${spec.openapiVersion} (${spec.operations.length} endpoints)`,
    order: 0,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };

  const requests: ApiRequest[] = spec.operations.map((op, idx) => {
    const queryParams: KeyValueParam[] = [];
    const headers: KeyValueParam[] = [
      { id: `h-acc-${idx}`, key: 'Accept', value: 'application/json', enabled: true },
    ];

    op.parameters.forEach((param, pIdx) => {
      if (param.in === 'query') {
        queryParams.push({
          id: `p-${idx}-${pIdx}`,
          key: param.name,
          value: param.example !== undefined ? String(param.example) : '',
          enabled: !!param.required,
          description: param.description,
        });
      } else if (param.in === 'header') {
        headers.push({
          id: `h-${idx}-${pIdx}`,
          key: param.name,
          value: param.example !== undefined ? String(param.example) : '',
          enabled: !!param.required,
          description: param.description,
        });
      }
    });

    let rawJsonContent = '';
    const bodyContent = op.requestBody?.content;
    if (bodyContent) {
      if (bodyContent['application/json']) {
        headers.push({
          id: `h-ct-${idx}`,
          key: 'Content-Type',
          value: 'application/json',
          enabled: true,
        });

        const jsonSchema = bodyContent['application/json'].schema;
        const jsonExample = bodyContent['application/json'].example;
        if (jsonExample) {
          rawJsonContent = JSON.stringify(jsonExample, null, 2);
        } else if (jsonSchema?.properties) {
          const sample: Record<string, any> = {};
          Object.keys(jsonSchema.properties).forEach((k) => {
            const prop = jsonSchema.properties[k];
            sample[k] = prop.example ?? (prop.type === 'number' ? 0 : prop.type === 'boolean' ? false : 'string');
          });
          rawJsonContent = JSON.stringify(sample, null, 2);
        } else {
          rawJsonContent = '{}';
        }
      }
    }

    return {
      id: `req-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      collectionId,
      name: op.summary || `${op.method} ${op.path}`,
      description: op.description,
      method: op.method,
      url: `{{base_url}}${op.path}`,
      params: queryParams,
      headers,
      body: {
        type: rawJsonContent ? 'json' : 'none',
        rawText: '',
        jsonContent: rawJsonContent,
        formParams: [],
        multipartParams: [],
      },
      auth: { type: 'none' },
      createdAt: now,
      updatedAt: now,
    };
  });

  const environments: Environment[] = mapServersToEnvironments(spec);

  return {
    collection,
    requests,
    environments,
  };
}

/**
 * Maps OpenAPI servers array into DevDesk Environments.
 */
export function mapServersToEnvironments(spec: OpenApiSpecification): Environment[] {
  const now = new Date().toISOString();
  return spec.servers.map((server, sIdx) => ({
    id: `env-openapi-${Date.now()}-${sIdx}`,
    name:
      server.description ||
      (spec.servers.length === 1 ? `${spec.title} Host` : `Server ${sIdx + 1}`),
    description: `Auto-generated environment from OpenAPI server: ${server.url}`,
    variables: [
      {
        id: `var-${sIdx}-base`,
        key: 'base_url',
        value: server.url.replace(/\/+$/, ''),
        isSecret: false,
        enabled: true,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }));
}

export const parseOpenApiSpec = parseOpenApiDocument;
export const generateCollectionFromSpec = generateCollectionFromOpenApi;
