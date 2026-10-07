import type { Environment, EnvironmentVariable } from '../../types/api';
import { resolveDynamicVariable } from './dynamicVariables';

/**
 * Replaces {{variable_name}} placeholders with active environment values or dynamic macros.
 */
export function interpolateVariables(
  template: string,
  environmentOrVars?: Environment | EnvironmentVariable[]
): string {
  if (!template) return '';

  const varMap = new Map<string, string>();
  if (environmentOrVars) {
    const vars = Array.isArray(environmentOrVars) ? environmentOrVars : environmentOrVars.variables;
    vars?.forEach((v) => {
      if (v.enabled) {
        varMap.set(v.key, v.value);
      }
    });
  }

  return template.replace(/\{\{\s*([$a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
    if (varMap.has(key)) {
      return varMap.get(key)!;
    }
    const dynamicVal = resolveDynamicVariable(key);
    if (dynamicVal !== null) {
      return dynamicVal;
    }
    return match; // Keep unresolved variables intact for clarity
  });
}

/**
 * Extract list of variable names referenced in a string (e.g. {{base_url}} -> ['base_url'])
 */
export function extractReferencedVariables(text: string): string[] {
  if (!text) return [];
  const matches = text.matchAll(/\{\{\s*([$a-zA-Z0-9_.-]+)\s*\}\}/g);
  const result: string[] = [];
  for (const m of matches) {
    if (m[1] && !result.includes(m[1])) {
      result.push(m[1]);
    }
  }
  return result;
}

export interface EnvironmentDiffItem {
  key: string;
  status: 'identical' | 'different' | 'only_in_a' | 'only_in_b';
  valA?: string;
  valB?: string;
  isSecret: boolean;
}

/**
 * Compare two environments side-by-side.
 */
export function compareEnvironments(
  envA: Environment,
  envB: Environment
): EnvironmentDiffItem[] {
  const mapA = new Map<string, EnvironmentVariable>();
  const mapB = new Map<string, EnvironmentVariable>();

  envA.variables.forEach((v) => mapA.set(v.key, v));
  envB.variables.forEach((v) => mapB.set(v.key, v));

  const allKeys = Array.from(new Set([...mapA.keys(), ...mapB.keys()])).sort();

  return allKeys.map((key) => {
    const varA = mapA.get(key);
    const varB = mapB.get(key);
    const isSecret = Boolean(varA?.isSecret || varB?.isSecret);

    if (varA && !varB) {
      return {
        key,
        status: 'only_in_a',
        valA: varA.value,
        valB: undefined,
        isSecret,
      };
    }
    if (!varA && varB) {
      return {
        key,
        status: 'only_in_b',
        valA: undefined,
        valB: varB.value,
        isSecret,
      };
    }
    if (varA && varB) {
      const isSame = varA.value === varB.value;
      return {
        key,
        status: isSame ? 'identical' : 'different',
        valA: varA.value,
        valB: varB.value,
        isSecret,
      };
    }

    return {
      key,
      status: 'identical',
      isSecret,
    };
  });
}

/**
 * Exports environment variables to .env or .env.example format.
 * Sensitive values are masked unless explicitly requested.
 */
export function exportDotEnvExample(environment: Environment, includeSecrets = false): string {
  const lines: string[] = [
    `# Environment: ${environment.name}`,
    `# Exported from DevDesk on ${new Date().toISOString().split('T')[0]}`,
    '',
  ];

  environment.variables.forEach((v) => {
    if (!v.enabled) {
      lines.push(`# ${v.key}=`);
      return;
    }
    if (v.isSecret && !includeSecrets) {
      lines.push(`${v.key}=your_${v.key.toLowerCase()}_here`);
    } else {
      lines.push(`${v.key}=${v.value}`);
    }
  });

  return lines.join('\n');
}
