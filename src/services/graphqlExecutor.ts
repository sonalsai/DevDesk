import type {
  KeyValueParam,
  Environment,
  GraphQLSchemaField,
  GraphQLSchemaType,
  GraphQLIntrospectionResult,
} from '../types/api';
import { interpolateVariables } from './environmentService';

export const STANDARD_INTROSPECTION_QUERY = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      name
      kind
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          name
          description
          defaultValue
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
        type {
          name
          kind
          ofType {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  }
}
`;

function unwrapTypeName(typeRef: any): string {
  if (!typeRef) return 'String';
  if (typeRef.name) return typeRef.name;
  if (typeRef.ofType) {
    if (typeRef.kind === 'NON_NULL') return `${unwrapTypeName(typeRef.ofType)}!`;
    if (typeRef.kind === 'LIST') return `[${unwrapTypeName(typeRef.ofType)}]`;
    return unwrapTypeName(typeRef.ofType);
  }
  return 'Unknown';
}

/**
 * Executes a GraphQL query or mutation against a remote endpoint.
 */
export async function executeGraphQL(
  endpointUrl: string,
  query: string,
  variablesStr?: string,
  headers?: KeyValueParam[],
  environment?: Environment
): Promise<{
  data?: any;
  errors?: any[];
  headers: Record<string, string>;
  timeMs: number;
  status: number;
  statusText: string;
  sizeBytes: number;
  rawText: string;
}> {
  const resolvedUrl = interpolateVariables(endpointUrl, environment);

  let parsedVars: any = undefined;
  if (variablesStr && variablesStr.trim()) {
    try {
      parsedVars = JSON.parse(variablesStr);
    } catch (err: any) {
      throw new Error(`Invalid GraphQL variables JSON: ${err.message}`);
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  (headers || []).forEach((h) => {
    if (h.enabled && h.key) {
      reqHeaders[h.key] = interpolateVariables(h.value, environment);
    }
  });

  const startTime = performance.now();

  const response = await fetch(resolvedUrl, {
    method: 'POST',
    headers: reqHeaders,
    body: JSON.stringify({
      query,
      variables: parsedVars,
    }),
  });

  const elapsed = Math.round(performance.now() - startTime);

  const resHeaders: Record<string, string> = {};
  response.headers.forEach((val, key) => {
    resHeaders[key.toLowerCase()] = val;
  });

  const rawText = await response.text();
  let json: any = null;

  try {
    json = JSON.parse(rawText);
  } catch {
    // Body is not JSON (e.g. 502 HTML page)
  }

  return {
    data: json?.data,
    errors: json?.errors,
    headers: resHeaders,
    timeMs: elapsed,
    status: response.status,
    statusText: response.statusText,
    sizeBytes: new Blob([rawText]).size,
    rawText,
  };
}

/**
 * Performs GraphQL Schema Introspection on a remote endpoint.
 */
export async function fetchSchemaIntrospection(
  endpointUrl: string,
  headers?: KeyValueParam[],
  environment?: Environment
): Promise<GraphQLIntrospectionResult> {
  const result = await executeGraphQL(
    endpointUrl,
    STANDARD_INTROSPECTION_QUERY,
    '{}',
    headers,
    environment
  );

  if (!result.data || !result.data.__schema) {
    const errorMsg =
      result.errors?.map((e) => e.message).join(', ') ||
      `Server returned status ${result.status} without schema data`;
    throw new Error(`Schema introspection failed: ${errorMsg}`);
  }

  const schema = result.data.__schema;
  const rawTypes: any[] = schema.types || [];

  // Filter out internal introspection types (__Type, __Field, etc.)
  const publicTypes = rawTypes.filter((t) => !t.name.startsWith('__'));

  const parsedTypes: GraphQLSchemaType[] = publicTypes.map((t) => {
    const fields: GraphQLSchemaField[] = (t.fields || []).map((f: any) => ({
      name: f.name,
      description: f.description,
      type: unwrapTypeName(f.type),
      args: (f.args || []).map((a: any) => ({
        name: a.name,
        type: unwrapTypeName(a.type),
        defaultValue: a.defaultValue,
      })),
    }));

    return {
      name: t.name,
      kind: t.kind,
      description: t.description,
      fields,
    };
  });

  return {
    types: parsedTypes,
    queryType: schema.queryType?.name,
    mutationType: schema.mutationType?.name,
    subscriptionType: schema.subscriptionType?.name,
    rawSchema: schema,
  };
}

/**
 * Interactive Query Builder: Generates a sample query fragment for a given field and schema type.
 */
export function buildQueryForField(
  field: GraphQLSchemaField,
  allTypes?: GraphQLSchemaType[]
): string {
  // If the return type is an object type with fields
  const baseType = field.type.replace(/[[\]!]/g, '');
  const targetSchemaType = allTypes?.find((t) => t.name === baseType);

  if (targetSchemaType && targetSchemaType.fields && targetSchemaType.fields.length > 0) {
    const subFields = targetSchemaType.fields
      .slice(0, 4)
      .map((f) => `    ${f.name}`)
      .join('\n');
    return `${field.name} {\n${subFields}\n  }`;
  }

  return field.name;
}

export const executeGraphQLQuery = executeGraphQL;
export const runIntrospectionQuery = fetchSchemaIntrospection;
export const generateFieldQuery = buildQueryForField;


