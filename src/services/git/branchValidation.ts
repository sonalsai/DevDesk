export interface BranchValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates branch names according to Git ref naming conventions
 * (git check-ref-format rules).
 */
export function validateBranchName(
  name: string,
  existingBranchNames: string[] = []
): BranchValidationResult {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Branch name cannot be empty.' };
  }

  const trimmed = name.trim();

  if (trimmed.length > 250) {
    return { isValid: false, error: 'Branch name is too long (maximum 250 characters).' };
  }

  if (/\s/.test(trimmed)) {
    return { isValid: false, error: 'Branch name cannot contain spaces or whitespace.' };
  }

  if (trimmed.startsWith('/') || trimmed.endsWith('/')) {
    return { isValid: false, error: 'Branch name cannot start or end with a slash ("/").' };
  }

  if (trimmed.includes('//')) {
    return { isValid: false, error: 'Branch name cannot contain consecutive slashes ("//").' };
  }

  if (trimmed.includes('..')) {
    return { isValid: false, error: 'Branch name cannot contain double dots ("..").' };
  }

  if (trimmed.endsWith('.lock')) {
    return { isValid: false, error: 'Branch name cannot end with ".lock".' };
  }

  if (trimmed.endsWith('.')) {
    return { isValid: false, error: 'Branch name cannot end with a dot (".").' };
  }

  if (trimmed.startsWith('-')) {
    return { isValid: false, error: 'Branch name cannot start with a hyphen ("-").' };
  }

  if (trimmed === '@' || trimmed.includes('@{')) {
    return { isValid: false, error: 'Branch name cannot contain reflog syntax ("@" or "@{").' };
  }

  // Illegal characters: ~ ^ : ? * [ \
  const illegalChars = /[~^:?*[\\\]]/;
  if (illegalChars.test(trimmed)) {
    return {
      isValid: false,
      error: 'Branch name cannot contain special characters like ~, ^, :, ?, *, [, \\, or ].',
    };
  }

  // ASCII control characters
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code < 32 || code === 127) {
      return { isValid: false, error: 'Branch name cannot contain control characters.' };
    }
  }

  // Duplicate check
  const duplicate = existingBranchNames.some(
    (existing) => existing.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return {
      isValid: false,
      error: `A branch named "${trimmed}" already exists in this repository.`,
    };
  }

  return { isValid: true };
}
