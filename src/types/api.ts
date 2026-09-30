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
