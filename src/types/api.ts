export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValueParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export type BodyType = 'none' | 'json' | 'form-urlencoded' | 'multipart' | 'raw';

export interface RequestBody {
  type: BodyType;
  rawText: string;
  jsonContent: string;
  formParams: KeyValueParam[];
  multipartParams: Array<KeyValueParam & { isFile?: boolean }>;
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface AuthConfig {
  type: AuthType;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyHeaderOrQuery?: 'header' | 'query';
  apiKeyName?: string;
  apiKeyValue?: string;
}

export interface ApiRequest {
  id: string;
  collectionId?: string;
  projectId?: string;
  name: string;
  description?: string;
  method: HttpMethod;
  url: string;
  params: KeyValueParam[];
  headers: KeyValueParam[];
  body: RequestBody;
  auth: AuthConfig;
  assertions?: ApiAssertion[];
  extractions?: RequestExtractionRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  cookies?: Array<{ name: string; value: string }>;
  data: string;
  contentType: string;
  isError?: boolean;
  errorMessage?: string;
  errorType?: 'cors' | 'network' | 'timeout' | 'abort' | 'parse' | 'general';
  assertionResults?: AssertionResult[];
}

export interface ApiCollection {
  id: string;
  projectId?: string;
  name: string;
  description?: string;
  isFavorite?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTab {
  id: string;
  requestId?: string;
  title: string;
  isDirty: boolean;
  request: ApiRequest;
  response: ApiResponse | null;
  isLoading: boolean;
}

export interface ApiHistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  status?: number;
  statusText?: string;
  timeMs?: number;
  sizeBytes?: number;
  timestamp: string;
  requestSnapshot: Omit<ApiRequest, 'auth'>;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  enabled: boolean;
}

export interface Environment {
  id: string;
  projectId?: string;
  name: string;
  description?: string;
  variables: EnvironmentVariable[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  sessionId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string;
  contentType: string;
  timestamp: string;
  ip?: string;
  status: number;
}

export interface WebhookSession {
  id: string;
  name: string;
  token: string;
  events: WebhookEvent[];
  createdAt: string;
}

export interface HttpStatusInfo {
  code: number;
  name: string;
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
  meaning: string;
  commonUse: string;
  troubleshooting: string;
}

// ============================================================================
// Phase 3: Real-Time API, GraphQL, OpenAPI & Backend Simulation Models
// ============================================================================

// --- Assertions & Automated Testing ---
export type AssertionType =
  | 'status_code'
  | 'status_2xx'
  | 'response_time'
  | 'header_exists'
  | 'header_equals'
  | 'json_path_exists'
  | 'json_path_equals'
  | 'body_contains';

export interface ApiAssertion {
  id: string;
  type: AssertionType;
  target?: string; // header name, jsonPath '$.user.id', etc.
  expected?: string; // expected value as string
  enabled: boolean;
}

export interface AssertionResult {
  assertionId: string;
  type: AssertionType;
  passed: boolean;
  message: string;
  actual?: string;
  expected?: string;
}

export interface RequestExtractionRule {
  id: string;
  jsonPath: string; // e.g. '$.token'
  variableName: string; // e.g. 'auth_token'
  enabled: boolean;
}

// --- WebSocket Client ---
export type WsMessageDirection = 'in' | 'out' | 'system' | 'error';

export interface WsMessage {
  id: string;
  direction: WsMessageDirection;
  data: string;
  timestamp: string;
  isBinary?: boolean;
  sizeBytes?: number;
  error?: string;
}

export type WsConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface WebSocketConnection {
  id: string;
  collectionId?: string;
  projectId?: string;
  name: string;
  url: string;
  protocols: string[];
  headers: KeyValueParam[];
  messages: WsMessage[];
  createdAt: string;
  updatedAt: string;
}

// --- Server-Sent Events (SSE) Client ---
export type SseConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SseEventItem {
  id: string;
  event: string;
  data: string;
  eventId?: string;
  timestamp: string;
  retry?: number;
}

export interface SseConnection {
  id: string;
  collectionId?: string;
  projectId?: string;
  name: string;
  url: string;
  headers: KeyValueParam[];
  events: SseEventItem[];
  createdAt: string;
  updatedAt: string;
}

// --- GraphQL Explorer ---
export interface GraphQLRequest {
  id: string;
  collectionId?: string;
  projectId?: string;
  name: string;
  endpoint: string;
  query: string;
  variables: string;
  headers: KeyValueParam[];
  createdAt: string;
  updatedAt: string;
}

export interface GraphQLSchemaField {
  name: string;
  description?: string;
  type: string;
  args?: Array<{ name: string; type: string; defaultValue?: string }>;
}

export interface GraphQLSchemaType {
  name: string;
  kind: string;
  description?: string;
  fields?: GraphQLSchemaField[];
}

export interface GraphQLIntrospectionResult {
  types: GraphQLSchemaType[];
  queryType?: string;
  mutationType?: string;
  subscriptionType?: string;
  rawSchema?: any;
}

// --- OpenAPI / Swagger ---
export interface OpenApiOperation {
  id: string;
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required?: boolean;
    description?: string;
    schema?: any;
    example?: any;
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, { schema?: any; example?: any }>;
  };
  responses: Record<string, {
    description?: string;
    content?: Record<string, { schema?: any; example?: any }>;
  }>;
  security?: any[];
}

export interface OpenApiSpecification {
  openapiVersion: string;
  title: string;
  version: string;
  description?: string;
  servers: Array<{ url: string; description?: string }>;
  tags: Array<{ name: string; description?: string }>;
  operations: OpenApiOperation[];
  schemas: Record<string, any>;
  securitySchemes: Record<string, any>;
  rawSpec?: any;
}

export interface OpenApiDocumentRecord {
  id: string;
  name: string;
  spec: OpenApiSpecification;
  sourceType: 'file' | 'url' | 'paste';
  sourceUrl?: string;
  importedAt: string;
}

// --- Local Mock Server ---
export interface MockScenario {
  id: string;
  name: string;
  status: number;
  statusText?: string;
  headers: KeyValueParam[];
  contentType: string;
  body: string;
  delayMs: number;
  isDefault: boolean;
}

export interface MockEndpoint {
  id: string;
  projectId?: string;
  name: string;
  method: HttpMethod;
  path: string; // e.g. '/api/users/:id'
  description?: string;
  enabled: boolean;
  scenarios: MockScenario[];
  activeScenarioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockRequestLog {
  id: string;
  endpointId?: string;
  method: HttpMethod;
  path: string;
  timestamp: string;
  status: number;
  timeMs: number;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string;
}

