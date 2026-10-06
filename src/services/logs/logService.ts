import type { LogEntry, LogLevel, LogFilterOptions } from '../../types/logs';

const LEVEL_REGEX = /\b(DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|TRACE)\b/i;
const ISO_DATE_REGEX = /\b(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\b/;

/**
 * Normalizes detected log level to standard LogLevel union.
 */
export function normalizeLogLevel(str: string): LogLevel {
  const upper = str.toUpperCase();
  if (upper === 'DEBUG' || upper === 'TRACE') return 'DEBUG';
  if (upper === 'INFO') return 'INFO';
  if (upper === 'WARN' || upper === 'WARNING') return 'WARN';
  if (upper === 'ERROR') return 'ERROR';
  if (upper === 'FATAL') return 'FATAL';
  return 'INFO';
}

/**
 * Parses a single raw log line into a structured LogEntry.
 * Detects both structured JSON logs and plain-text standard logs.
 */
export function parseLogLine(raw: string, defaultSource = 'system'): LogEntry {
  const trimmed = raw.trim();
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 1. Check if structured JSON log
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;

      const levelStr = String(parsed.level || parsed.severity || parsed.lvl || 'INFO');
      const level = normalizeLogLevel(levelStr);

      const timestamp = String(
        parsed.timestamp || parsed.time || parsed['@timestamp'] || new Date().toISOString()
      );

      const source = String(parsed.service || parsed.source || parsed.app || defaultSource);
      const message = String(parsed.message || parsed.msg || parsed.log || trimmed);

      return {
        id,
        timestamp,
        level,
        source,
        message,
        raw,
        data: parsed,
      };
    } catch {
      // Fallback to plain text parsing if JSON parse fails
    }
  }

  // 2. Parse plain text log line
  let timestamp = new Date().toISOString();
  const dateMatch = trimmed.match(ISO_DATE_REGEX);
  if (dateMatch) {
    timestamp = dateMatch[1];
  }

  let level: LogLevel = 'INFO';
  const levelMatch = trimmed.match(LEVEL_REGEX);
  if (levelMatch) {
    level = normalizeLogLevel(levelMatch[1]);
  }

  let source = defaultSource;
  const bracketMatches = Array.from(trimmed.matchAll(/\[([a-zA-Z0-9_-]+)\]/g));
  for (const match of bracketMatches) {
    const candidate = match[1];
    if (!LEVEL_REGEX.test(candidate)) {
      source = candidate;
      break;
    }
  }

  return {
    id,
    timestamp,
    level,
    source,
    message: raw,
    raw,
  };
}

/**
 * Filters log entries by search text, levels, sources, and time range.
 */
export function filterLogs(logs: LogEntry[], options: LogFilterOptions): LogEntry[] {
  let result = logs;

  // Filter by log levels
  if (options.levels && options.levels.length > 0) {
    const levelSet = new Set(options.levels);
    result = result.filter((l) => levelSet.has(l.level));
  }

  // Filter by source
  if (options.sources && options.sources.length > 0) {
    const sourceSet = new Set(options.sources);
    result = result.filter((l) => sourceSet.has(l.source));
  }

  // Filter by time range
  if (options.timeRange && options.timeRange !== 'all') {
    const now = Date.now();
    const windowMs =
      options.timeRange === '15m'
        ? 15 * 60 * 1000
        : options.timeRange === '1h'
          ? 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;

    result = result.filter((l) => {
      const t = new Date(l.timestamp).getTime();
      return !isNaN(t) && now - t <= windowMs;
    });
  }

  // Filter by search query
  if (options.searchQuery && options.searchQuery.trim()) {
    const query = options.caseSensitive
      ? options.searchQuery.trim()
      : options.searchQuery.trim().toLowerCase();

    result = result.filter((l) => {
      const msg = options.caseSensitive ? l.message : l.message.toLowerCase();
      const rawText = options.caseSensitive ? l.raw : l.raw.toLowerCase();
      const src = options.caseSensitive ? l.source : l.source.toLowerCase();
      return msg.includes(query) || rawText.includes(query) || src.includes(query);
    });
  }

  return result;
}

/**
 * Trims log array to retention count limit to avoid high memory consumption.
 */
export function trimLogsToRetention(logs: LogEntry[], maxCount = 1000): LogEntry[] {
  if (logs.length <= maxCount) return logs;
  return logs.slice(logs.length - maxCount);
}

/**
 * Exports logs to plain text format.
 */
export function exportLogsToTxt(logs: LogEntry[]): string {
  return logs
    .map((l) => `[${l.timestamp}] [${l.level.padEnd(5)}] [${l.source}] ${l.message}`)
    .join('\n');
}

/**
 * Exports logs to JSON array format.
 */
export function exportLogsToJson(logs: LogEntry[]): string {
  return JSON.stringify(logs, null, 2);
}

/**
 * Exports logs to CSV format.
 */
export function exportLogsToCsv(logs: LogEntry[]): string {
  const headers = ['id', 'timestamp', 'level', 'source', 'message'];
  const rows = logs.map((l) => {
    const cleanMsg = l.message.replace(/"/g, '""').replace(/\n/g, ' ');
    return `"${l.id}","${l.timestamp}","${l.level}","${l.source}","${cleanMsg}"`;
  });
  return [headers.join(','), ...rows].join('\n');
}

export const INITIAL_DEMO_LOGS: LogEntry[] = [
  parseLogLine(
    '2026-10-03T10:14:02.120Z [INFO] [devdesk-api] Starting NestJS HTTP server on port 3000',
    'devdesk-api'
  ),
  parseLogLine(
    JSON.stringify({
      level: 'info',
      service: 'devdesk-api',
      message: 'Database connection pool established successfully (5 min, 20 max)',
      timestamp: '2026-10-03T10:14:03.200Z',
      poolSize: 5,
    }),
    'devdesk-api'
  ),
  parseLogLine(
    '2026-10-03T10:14:05.412Z [DEBUG] [cache-worker] Redis sentinel heartbeat acknowledged: 0 pending tasks',
    'cache-worker'
  ),
  parseLogLine(
    JSON.stringify({
      level: 'warn',
      service: 'devdesk-api',
      message: 'External auth webhook latency high: 1420ms response time from IdP',
      timestamp: '2026-10-03T10:18:22.000Z',
      latencyMs: 1420,
      endpoint: '/oauth/token',
    }),
    'devdesk-api'
  ),
  parseLogLine(
    '2026-10-03T10:20:11.890Z [ERROR] [postgres-db] ERROR: relation "users_temp" does not exist at character 15',
    'postgres-db'
  ),
  parseLogLine(
    JSON.stringify({
      level: 'error',
      service: 'devdesk-api',
      message: 'Unhandled Promise Rejection: timeout of 5000ms exceeded fetching remote schema',
      timestamp: '2026-10-03T10:22:45.312Z',
      error: 'ETIMEDOUT',
      stack: 'Error: timeout\n    at Request.abort (/app/node_modules/axios/lib/core.js:142:11)',
    }),
    'devdesk-api'
  ),
  parseLogLine(
    '2026-10-03T10:25:00.000Z [INFO] [metrics] System metrics: CPU 12%, Memory 382MB/1024MB, Active Sockets 18',
    'metrics'
  ),
];
