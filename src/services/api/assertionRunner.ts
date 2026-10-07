import type {
  ApiAssertion,
  AssertionResult,
  ApiResponse,
  RequestExtractionRule,
  Environment,
} from '../../types/api';

/**
 * Safely extracts a value from a JSON object using simple dot/bracket JSONPath notation.
 * Examples: '$.user.id', 'user.name', '$.items[0].title', 'status'
 * NEVER uses eval().
 */
export function extractValueByJsonPath(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  if (!path || path.trim() === '' || path === '$') return obj;

  // Clean leading '$' or '$.'
  const normalizedPath = path.replace(/^\$\.?/, '');
  if (!normalizedPath) return obj;

  // Split path tokens: handles 'user.profile.name' and 'items[0].id'
  const tokens: string[] = [];
  const regex = /[^[.\]]+|\[\d+\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalizedPath)) !== null) {
    let token = match[0];
    if (token.startsWith('[') && token.endsWith(']')) {
      token = token.slice(1, -1);
    }
    tokens.push(token);
  }

  let current = obj;
  for (const token of tokens) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[token];
  }

  return current;
}

/**
 * Evaluates a single assertion against an API response.
 * Safe, synchronous, and non-evaluating.
 */
export function evaluateAssertion(
  assertion: ApiAssertion,
  response: ApiResponse,
  actualTimeMs?: number
): AssertionResult {
  if (!assertion.enabled) {
    return {
      assertionId: assertion.id,
      type: assertion.type,
      passed: true,
      message: 'Assertion skipped (disabled)',
    };
  }

  const anyAssertion = assertion as any;
  const target = (assertion.target ?? anyAssertion.property ?? '').trim();
  const expected = (assertion.expected ?? anyAssertion.expectedValue ?? '').trim();
  const timeMs = actualTimeMs ?? response.timeMs ?? (response as any).time ?? 0;

  switch (assertion.type as string) {
    case 'status_code':
    case 'status_equals': {
      const expectedStatus = parseInt(expected || '200', 10);
      const passed = response.status === expectedStatus;
      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed,
        actual: String(response.status),
        expected: String(expectedStatus),
        message: passed
          ? `Status code equals ${expectedStatus}`
          : `Expected status ${expectedStatus} but received ${response.status}`,
      };
    }

    case 'status_2xx':
    case 'status_range_2xx': {
      const passed = response.status >= 200 && response.status < 300;
      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed,
        actual: String(response.status),
        expected: '2xx Successful',
        message: passed
          ? `Status is successful (${response.status})`
          : `Expected 2xx status code but received ${response.status}`,
      };
    }

    case 'response_time':
    case 'response_time_less_than': {
      const maxMs = parseInt(expected || '1000', 10);
      const passed = timeMs <= maxMs;
      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed,
        actual: `${timeMs}ms`,
        expected: `< ${maxMs}ms`,
        message: passed
          ? `Response received in ${timeMs}ms (under ${maxMs}ms limit)`
          : `Response took ${timeMs}ms, exceeding threshold of ${maxMs}ms`,
      };
    }

    case 'header_exists': {
      const targetHeader = target.toLowerCase();
      const headersLower = Object.keys(response.headers || {}).reduce<Record<string, string>>(
        (acc, k) => {
          acc[k.toLowerCase()] = response.headers[k];
          return acc;
        },
        {}
      );
      const passed = targetHeader in headersLower;
      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed,
        actual: passed ? headersLower[targetHeader] : 'Not present',
        expected: `Header '${target}' exists`,
        message: passed
          ? `Header '${target}' is present in response`
          : `Header '${target}' was not returned by server`,
      };
    }

    case 'header_equals': {
      const targetHeader = target.toLowerCase();
      const expectedVal = expected;
      const headersLower = Object.keys(response.headers || {}).reduce<Record<string, string>>(
        (acc, k) => {
          acc[k.toLowerCase()] = response.headers[k];
          return acc;
        },
        {}
      );
      const actualVal = headersLower[targetHeader];
      const passed = actualVal !== undefined && (actualVal.includes(expectedVal) || actualVal === expectedVal);
      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed,
        actual: actualVal ?? 'undefined',
        expected: expectedVal,
        message: passed
          ? `Header '${target}' contains expected value`
          : `Expected header '${target}' to match '${expectedVal}', got '${actualVal ?? 'not set'}'`,
      };
    }

    case 'body_contains': {
      const expectedText = expected;
      const bodyStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data || '');
      const passed = bodyStr.includes(expectedText);
      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed,
        actual: bodyStr.length > 40 ? `${bodyStr.slice(0, 40)}...` : bodyStr,
        expected: `Contains: "${expectedText}"`,
        message: passed
          ? `Response body contains string "${expectedText}"`
          : `String "${expectedText}" was not found in response body`,
      };
    }

    case 'json_path_exists': {
      let parsedData: any = null;
      try {
        parsedData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } catch {
        return {
          assertionId: assertion.id,
          type: assertion.type,
          passed: false,
          actual: 'Non-JSON body',
          expected: `JSON path '${target}'`,
          message: 'Cannot evaluate JSON path: response body is not valid JSON',
        };
      }

      const val = extractValueByJsonPath(parsedData, target || '$');
      const passed = val !== undefined && val !== null;
      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed,
        actual: passed ? JSON.stringify(val) : 'undefined',
        expected: `Value at '${target}' exists`,
        message: passed
          ? `JSONPath '${target}' found matching value`
          : `No value found at JSONPath '${target}'`,
      };
    }

    case 'json_path_equals': {
      let parsedData: any = null;
      try {
        parsedData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } catch {
        return {
          assertionId: assertion.id,
          type: assertion.type,
          passed: false,
          actual: 'Non-JSON body',
          expected: `JSON path '${target}' == ${expected}`,
          message: 'Cannot evaluate JSON path: response body is not valid JSON',
        };
      }

      const val = extractValueByJsonPath(parsedData, target || '$');
      const actualStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      const expectedStr = expected;

      // Flexible string/boolean/number matching
      let passed = actualStr === expectedStr;
      if (!passed && typeof val === 'boolean') {
        passed = String(val).toLowerCase() === expectedStr.toLowerCase();
      } else if (!passed && typeof val === 'number') {
        passed = val === Number(expectedStr);
      }

      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed,
        actual: actualStr,
        expected: expectedStr,
        message: passed
          ? `JSONPath '${assertion.target}' equals expected value`
          : `JSONPath '${assertion.target}' is '${actualStr}', expected '${expectedStr}'`,
      };
    }

    default:
      return {
        assertionId: assertion.id,
        type: assertion.type,
        passed: true,
        message: 'Unknown assertion type',
      };
  }
}

/**
 * Runs a list of assertions sequentially against an API response.
 */
export function evaluateAllAssertions(
  assertions: ApiAssertion[] | undefined,
  response: ApiResponse,
  elapsedMs?: number
): AssertionResult[] {
  if (!assertions || assertions.length === 0) return [];
  return assertions.map((a) => evaluateAssertion(a, response, elapsedMs));
}

/**
 * Executes response variable extraction rules (Request Chaining Foundation).
 * Extracts tokens/IDs from response JSON and returns updated variable mappings.
 */
export function executeExtractions(
  rules: RequestExtractionRule[] | undefined,
  response: ApiResponse,
  activeEnv?: Environment
): Record<string, string> {
  if (!rules || rules.length === 0) return {};

  let parsed: any = null;
  try {
    parsed = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  } catch {
    return {};
  }

  const extracted: Record<string, string> = {};

  for (const rule of rules) {
    if (!rule.enabled || !rule.variableName || !rule.jsonPath) continue;

    const val = extractValueByJsonPath(parsed, rule.jsonPath);
    if (val !== undefined && val !== null) {
      const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
      extracted[rule.variableName] = strVal;

      // Update in active environment if matching variable exists
      if (activeEnv) {
        const targetVar = activeEnv.variables.find((v) => v.key === rule.variableName);
        if (targetVar) {
          targetVar.value = strVal;
        }
      }
    }
  }

  return extracted;
}

export const evaluateAssertions = evaluateAllAssertions;
export const executeRequestExtractions = executeExtractions;
