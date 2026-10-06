import YAML from 'yaml';
import type { YamlParseResult } from '../../types/config';

/**
 * Validates a YAML string and extracts precise line and column errors.
 */
export function validateYaml(yamlStr: string): YamlParseResult {
  if (!yamlStr || !yamlStr.trim()) {
    return {
      isValid: true,
      data: null,
      jsonString: 'null',
    };
  }

  try {
    const data = YAML.parse(yamlStr);
    return {
      isValid: true,
      data,
      jsonString: JSON.stringify(data, null, 2),
    };
  } catch (err: unknown) {
    const errorObj = err as {
      message?: string;
      linePos?: Array<{ line: number; col: number }>;
    };

    let line = 1;
    let column = 1;

    if (errorObj.linePos && errorObj.linePos.length > 0) {
      line = errorObj.linePos[0].line;
      column = errorObj.linePos[0].col;
    } else if (errorObj.message) {
      const match = errorObj.message.match(/at line (\d+), column (\d+)/i);
      if (match) {
        line = parseInt(match[1], 10);
        column = parseInt(match[2], 10);
      }
    }

    return {
      isValid: false,
      error: {
        line,
        column,
        message: errorObj.message || 'Invalid YAML format',
      },
    };
  }
}

/**
 * Formats a YAML string with the specified indentation.
 */
export function formatYaml(yamlStr: string, indent = 2): string {
  if (!yamlStr || !yamlStr.trim()) return '';
  const parsed = YAML.parse(yamlStr);
  return YAML.stringify(parsed, { indent });
}

/**
 * Converts YAML to JSON.
 */
export function yamlToJson(yamlStr: string, indent = 2): string {
  if (!yamlStr || !yamlStr.trim()) return '{}';
  const parsed = YAML.parse(yamlStr);
  return JSON.stringify(parsed, null, indent);
}

/**
 * Converts JSON to YAML.
 */
export function jsonToYaml(jsonStr: string): string {
  if (!jsonStr || !jsonStr.trim()) return '';
  const parsed = JSON.parse(jsonStr);
  return YAML.stringify(parsed);
}

export interface ConfigTreeNode {
  key: string;
  path: string;
  value?: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  isSecret?: boolean;
  children?: ConfigTreeNode[];
}

const SENSITIVE_KEY_REGEX = /(password|secret|token|api_?key|auth|private_?key|credential|cert|database_?url|db_?url|db_?pass)/i;

/**
 * Converts structured config into an expandable tree hierarchy with sensitive value masking.
 */
export function buildConfigTree(data: unknown, currentPath = 'root', parentKey = ''): ConfigTreeNode[] {
  if (data === null || data === undefined) {
    return [
      {
        key: parentKey || 'null',
        path: currentPath,
        value: null,
        type: 'null',
      },
    ];
  }

  if (Array.isArray(data)) {
    return data.map((item, index) => {
      const itemPath = `${currentPath}[${index}]`;
      const isPrimitive = typeof item !== 'object' || item === null;
      return {
        key: `[${index}]`,
        path: itemPath,
        type: Array.isArray(item) ? 'array' : typeof item === 'object' && item !== null ? 'object' : (typeof item as ConfigTreeNode['type']),
        value: isPrimitive ? item : undefined,
        children: !isPrimitive ? buildConfigTree(item, itemPath, `[${index}]`) : undefined,
      };
    });
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    return entries.map(([key, val]) => {
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      const isSecret = SENSITIVE_KEY_REGEX.test(key);

      if (val !== null && typeof val === 'object') {
        const isArr = Array.isArray(val);
        return {
          key,
          path: childPath,
          type: isArr ? 'array' : 'object',
          isSecret,
          children: buildConfigTree(val, childPath, key),
        };
      }

      return {
        key,
        path: childPath,
        value: val,
        type: val === null ? 'null' : (typeof val as ConfigTreeNode['type']),
        isSecret,
      };
    });
  }

  return [
    {
      key: parentKey || 'value',
      path: currentPath,
      value: data,
      type: typeof data as ConfigTreeNode['type'],
    },
  ];
}
