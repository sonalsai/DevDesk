export interface YamlParseResult {
  isValid: boolean;
  data?: unknown;
  jsonString?: string;
  error?: {
    line?: number;
    column?: number;
    message: string;
  };
}

export interface EnvVariableEntry {
  id: string;
  key: string;
  value: string;
  comment?: string;
  isSecret: boolean;
  isActive: boolean;
}

export interface EnvFileRecord {
  id: string;
  name: string; // e.g. .env, .env.local, .env.development, .env.staging, .env.production
  content: string;
  variables: EnvVariableEntry[];
  updatedAt: string;
}

export interface EnvCompareResult {
  key: string;
  status: 'same' | 'different' | 'missing_in_a' | 'missing_in_b';
  valA?: string;
  valB?: string;
  isSecret: boolean;
}
