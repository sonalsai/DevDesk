import { describe, it, expect } from 'vitest';
import {
  validateSSHProfile,
  simulateSSHCommand,
  createWelcomeBanner,
  INITIAL_DEMO_SSH_PROFILES,
} from '../src/services/ssh';
import {
  validateYaml,
  formatYaml,
  yamlToJson,
  jsonToYaml,
  buildConfigTree,
} from '../src/services/config/yamlService';
import {
  parseEnvFile,
  stringifyEnvFile,
  generateEnvExample,
  compareEnvFiles,
  INITIAL_DEMO_ENV_FILES,
} from '../src/services/config/envFileService';
import {
  parseLogLine,
  filterLogs,
  trimLogsToRetention,
  exportLogsToTxt,
  exportLogsToJson,
  exportLogsToCsv,
  INITIAL_DEMO_LOGS,
} from '../src/services/logs';

describe('SSH Essentials & Security', () => {
  it('validates SSH connection profile input', () => {
    const validProfile = {
      name: 'Production Server',
      host: 'api.production.internal',
      port: 22,
      username: 'deploy',
      authMethod: 'key' as const,
    };
    expect(validateSSHProfile(validProfile).isValid).toBe(true);

    // Missing host
    expect(validateSSHProfile({ ...validProfile, host: '' }).error).toBe('Host or IP address is required.');

    // Missing username
    expect(validateSSHProfile({ ...validProfile, username: '' }).error).toBe('Username is required.');

    // Invalid port
    expect(validateSSHProfile({ ...validProfile, port: 70000 }).error).toBe('Port must be a valid number between 1 and 65535.');
    expect(validateSSHProfile({ ...validProfile, port: 0 }).error).toBe('Port must be a valid number between 1 and 65535.');
  });

  it('generates sandbox welcome banner and disclaimer', () => {
    const profiles = INITIAL_DEMO_SSH_PROFILES;
    const banner = createWelcomeBanner(profiles[0]);
    expect(banner.some((line) => line.text.includes('Connected to'))).toBe(true);
    expect(banner.some((line) => line.text.includes('browser sandbox'))).toBe(true);
  });

  it('simulates safe interactive shell commands', () => {
    const profile = INITIAL_DEMO_SSH_PROFILES[0];
    expect(simulateSSHCommand('help', profile).output).toContain('Available sandbox commands:');
    expect(simulateSSHCommand('whoami', profile).output).toBe(profile.username);
    expect(simulateSSHCommand('hostname', profile).output).toBe(profile.host);
    expect(simulateSSHCommand('uptime', profile).output).toContain('load average');
    expect(simulateSSHCommand('ps aux', profile).output).toContain('COMMAND');
    expect(simulateSSHCommand('nonexistent_command_xyz', profile).output).toContain('virtual session');
  });
});

describe('YAML & Configuration Toolkit', () => {
  const sampleYaml = `
app:
  name: devdesk
  port: 8080
  database:
    host: localhost
    secret_key: supersecret123
    password: mypassword
  tags:
    - web
    - tools
`.trim();

  it('validates well-formed and malformed YAML with line/column pointers', () => {
    const valid = validateYaml(sampleYaml);
    expect(valid.isValid).toBe(true);
    expect(valid.data).toBeDefined();
    expect(valid.jsonString).toBeDefined();
    expect(valid.error).toBeUndefined();

    // Invalid YAML (bad indentation / colons)
    const invalidYaml = 'app:\n  name: [unclosed array\n    nested: true';
    const invalid = validateYaml(invalidYaml);
    expect(invalid.isValid).toBe(false);
    expect(invalid.error).toBeDefined();
    expect(invalid.error?.line).toBeGreaterThan(0);
    expect(invalid.error?.column).toBeGreaterThan(0);
  });

  it('formats YAML indentation cleanly', () => {
    const unformatted = 'a:\n    b: 1\n    c:\n        d: 2';
    const formatted = formatYaml(unformatted, 2);
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('converts YAML to JSON and JSON to YAML accurately', () => {
    const jsonResult = yamlToJson(sampleYaml);
    expect(jsonResult).toBeDefined();

    const parsedJson = JSON.parse(jsonResult);
    expect(parsedJson.app.name).toBe('devdesk');
    expect(parsedJson.app.port).toBe(8080);

    const backToYaml = jsonToYaml(jsonResult);
    expect(backToYaml).toContain('devdesk');
  });

  it('builds configuration tree and masks sensitive secrets by default', () => {
    const { data } = validateYaml(sampleYaml);
    expect(data).toBeDefined();
    const tree = buildConfigTree(data);

    const appNode = tree.find((n) => n.key === 'app');
    expect(appNode).toBeDefined();

    // Look for nested database node
    const dbNode = appNode?.children?.find((n) => n.key === 'database');
    expect(dbNode).toBeDefined();

    // Check that secret_key and password are identified as secrets
    const secretKeyNode = dbNode?.children?.find((n) => n.key === 'secret_key');
    expect(secretKeyNode?.isSecret).toBe(true);

    const passwordNode = dbNode?.children?.find((n) => n.key === 'password');
    expect(passwordNode?.isSecret).toBe(true);

    // Non-secret node should not be marked secret
    const hostNode = dbNode?.children?.find((n) => n.key === 'host');
    expect(hostNode?.isSecret).toBe(false);
    expect(hostNode?.value).toBe('localhost');
  });
});

describe('Environment File Tools & Secret Protection', () => {
  const sampleEnvRaw = `
# Server Configuration
PORT=3000
HOST=0.0.0.0

# Secrets & Database
DATABASE_URL=postgres://user:secret123@localhost:5432/db
API_KEY=live_sk_987654321abcdef
JWT_SECRET=super_jwt_secret_key
DEBUG=true
`.trim();

  it('parses .env files identifying comments, keys, and masking secrets', () => {
    const vars = parseEnvFile(sampleEnvRaw);
    expect(vars.length).toBe(6);

    const portVar = vars.find((v) => v.key === 'PORT');
    expect(portVar?.value).toBe('3000');
    expect(portVar?.isSecret).toBe(false);

    const apiKeyVar = vars.find((v) => v.key === 'API_KEY');
    expect(apiKeyVar?.value).toBe('live_sk_987654321abcdef');
    expect(apiKeyVar?.isSecret).toBe(true);

    const dbVar = vars.find((v) => v.key === 'DATABASE_URL');
    expect(dbVar?.isSecret).toBe(true);
  });

  it('stringifies environment variables back to raw format', () => {
    const vars = parseEnvFile('FOO=bar\nBAZ=qux');
    const raw = stringifyEnvFile(vars);
    expect(raw).toContain('FOO=bar');
    expect(raw).toContain('BAZ=qux');
  });

  it('generates .env.example without leaking any sensitive secret values', () => {
    const example = generateEnvExample(sampleEnvRaw);

    // Non-sensitive values like PORT or DEBUG can have defaults or blanks
    expect(example).toContain('PORT=3000');
    expect(example).toContain('DEBUG=true');

    // SENSITIVE SECRETS MUST NEVER BE COPIED!
    expect(example).not.toContain('live_sk_987654321abcdef');
    expect(example).not.toContain('secret123');
    expect(example).not.toContain('super_jwt_secret_key');

    // Secrets must be empty strings
    expect(example).toContain('API_KEY=');
    expect(example).toContain('JWT_SECRET=');
    expect(example).toContain('DATABASE_URL=');
  });

  it('compares environments safely without exposing confidential contents', () => {
    const devEnvRaw = 'PORT=3000\nAPI_KEY=dev_key_1\nONLY_IN_DEV=true';
    const prodEnvRaw = 'PORT=80\nAPI_KEY=prod_key_2\nONLY_IN_PROD=true';

    const differences = compareEnvFiles(devEnvRaw, prodEnvRaw);
    expect(differences.length).toBe(4);

    const portDiff = differences.find((d) => d.key === 'PORT');
    expect(portDiff?.status).toBe('different');

    const apiKeyDiff = differences.find((d) => d.key === 'API_KEY');
    expect(apiKeyDiff?.status).toBe('different');
    expect(apiKeyDiff?.isSecret).toBe(true);
    expect(apiKeyDiff?.valA).toBe('••••••••');
    expect(apiKeyDiff?.valB).toBe('••••••••');

    const onlyDev = differences.find((d) => d.key === 'ONLY_IN_DEV');
    expect(onlyDev?.status).toBe('missing_in_b');

    const onlyProd = differences.find((d) => d.key === 'ONLY_IN_PROD');
    expect(onlyProd?.status).toBe('missing_in_a');
  });

  it('provides initial demo .env files for rapid developer testing', () => {
    expect(INITIAL_DEMO_ENV_FILES.length).toBeGreaterThanOrEqual(3);
    const envDefault = INITIAL_DEMO_ENV_FILES.find((f) => f.name === '.env');
    expect(envDefault).toBeDefined();
    expect(envDefault?.variables.some((v) => v.isSecret)).toBe(true);
  });
});

describe('Local Log Viewer & High-Performance Buffering', () => {
  it('parses plain text logs with automatic timestamp and level detection', () => {
    const rawLine = '2026-10-03T10:00:00Z [ERROR] [api-server] Database connection timed out after 5000ms';
    const entry = parseLogLine(rawLine, 'api-server');

    expect(entry.level).toBe('ERROR');
    expect(entry.source).toBe('api-server');
    expect(entry.message).toContain('Database connection timed out');
  });

  it('parses structured JSON logs extracting message, level, and metadata', () => {
    const jsonLine = JSON.stringify({
      timestamp: '2026-10-03T10:05:00Z',
      level: 'warn',
      service: 'auth-service',
      message: 'Rate limit threshold reached for client',
      ip: '192.168.1.1',
      attempts: 5,
    });

    const entry = parseLogLine(jsonLine, 'auth-service');
    expect(entry.level).toBe('WARN');
    expect(entry.message).toBe('Rate limit threshold reached for client');
    expect(entry.data?.ip).toBe('192.168.1.1');
    expect(entry.data?.attempts).toBe(5);
  });

  it('filters logs by query, level, and source', () => {
    const logs = INITIAL_DEMO_LOGS;

    // Query filter
    const searchLogs = filterLogs(logs, { searchQuery: 'database', levels: [], sources: [], caseSensitive: false });
    expect(searchLogs.every((l) => l.message.toLowerCase().includes('database') || JSON.stringify(l.data).toLowerCase().includes('database'))).toBe(true);

    // Level filter
    const errorLogs = filterLogs(logs, { searchQuery: '', levels: ['ERROR'], sources: [], caseSensitive: false });
    expect(errorLogs.every((l) => l.level === 'ERROR')).toBe(true);

    // Source filter
    const containerLogs = filterLogs(logs, { searchQuery: '', levels: [], sources: ['devdesk-api'], caseSensitive: false });
    expect(containerLogs.every((l) => l.source === 'devdesk-api')).toBe(true);
  });

  it('enforces retention limit to prevent unlimited memory growth', () => {
    const fakeLogs = Array.from({ length: 1500 }, (_, i) => ({
      id: `log-${i}`,
      timestamp: new Date().toISOString(),
      level: 'INFO' as const,
      source: 'test-app',
      message: `Log line message ${i}`,
      raw: `Log line message ${i}`,
    }));

    const trimmed = trimLogsToRetention(fakeLogs, 1000);
    expect(trimmed.length).toBe(1000);
    // Should retain the most recent 1000 (starting from index 500)
    expect(trimmed[0].id).toBe('log-500');
    expect(trimmed[999].id).toBe('log-1499');
  });

  it('exports logs to TXT, JSON, and CSV safely', () => {
    const logs = INITIAL_DEMO_LOGS.slice(0, 5);

    // Plain text export
    const txt = exportLogsToTxt(logs);
    expect(txt).toContain('[INFO ]');

    // JSON export
    const json = exportLogsToJson(logs);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(5);

    // CSV export
    const csv = exportLogsToCsv(logs);
    expect(csv).toContain('id,timestamp,level,source,message');
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(6);
  });
});
