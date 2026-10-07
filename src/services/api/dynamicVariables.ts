/**
 * Dynamic System Variables Engine for DevDesk
 * Compliant with global industry standards (Postman, Insomnia, Bruno).
 * Resolves {{$guid}}, {{$timestamp}}, {{$randomEmail}}, etc. at runtime.
 */

export function resolveDynamicVariable(name: string): string | null {
  const clean = name.trim().toLowerCase();

  switch (clean) {
    case '$guid':
    case '$uuid':
      return generateUuidV4();

    case '$timestamp':
      return Math.floor(Date.now() / 1000).toString();

    case '$isotimestamp':
      return new Date().toISOString();

    case '$randomint':
      return Math.floor(Math.random() * 1000 + 1).toString();

    case '$randomemail': {
      const rand = Math.random().toString(36).substring(2, 7);
      return `engineer.${rand}@devdesk.local`;
    }

    case '$randomalphanumeric':
    case '$randomstring':
      return Math.random().toString(36).substring(2, 12);

    case '$randomip':
      return [
        Math.floor(Math.random() * 223 + 1),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 254 + 1),
      ].join('.');

    case '$randomboolean':
      return Math.random() > 0.5 ? 'true' : 'false';

    default:
      return null;
  }
}

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback
    }
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const DYNAMIC_SYSTEM_VARIABLES = [
  { key: '$guid', desc: 'RFC4122 UUID v4' },
  { key: '$uuid', desc: 'RFC4122 UUID v4 (alias)' },
  { key: '$timestamp', desc: 'Current Unix timestamp in seconds' },
  { key: '$isoTimestamp', desc: 'Current ISO 8601 UTC timestamp' },
  { key: '$randomInt', desc: 'Random integer between 1 and 1000' },
  { key: '$randomEmail', desc: 'Random synthetic developer email' },
  { key: '$randomString', desc: '10-character random alphanumeric string' },
  { key: '$randomIp', desc: 'Synthetic IPv4 address' },
  { key: '$randomBoolean', desc: 'Random true/false boolean' },
];
