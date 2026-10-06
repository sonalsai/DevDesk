export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  raw: string;
  data?: Record<string, unknown>;
}

export interface LogFilterOptions {
  searchQuery: string;
  levels: LogLevel[];
  sources: string[];
  caseSensitive: boolean;
  timeRange?: 'all' | '15m' | '1h' | '24h';
}
