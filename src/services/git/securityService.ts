/**
 * Masks embedded credentials in URLs (e.g. https://user:secret@github.com/... -> https://user:***@github.com/...)
 */
export function maskCredentialsInUrl(url: string): string {
  if (!url) return '';
  try {
    // Match URL with user:password@
    const regex = /^(https?:\/\/)([^:@\s]+):([^@\s]+)@/i;
    if (regex.test(url)) {
      return url.replace(regex, '$1$2:***@');
    }
    // Match URL with user_or_token@
    const tokenRegex = /^(https?:\/\/)([^:@\s]+)@/i;
    if (tokenRegex.test(url)) {
      return url.replace(tokenRegex, '$1$2:***@');
    }
    // Match ssh / git format with password git://user:pass@host
    const gitRegex = /^(git:\/\/[^:@\s]+):([^@\s]+)@/i;
    if (gitRegex.test(url)) {
      return url.replace(gitRegex, '$1:***@');
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Checks if a file path potentially points to a secret, token, key, or sensitive environment file.
 */
export function isPotentialSecretFile(filePath: string): { isSecret: boolean; reason?: string } {
  if (!filePath) return { isSecret: false };

  const normalized = filePath.toLowerCase().replace(/\\/g, '/');
  const fileName = normalized.split('/').pop() || '';

  // Environment file patterns
  if (
    fileName === '.env' ||
    fileName.startsWith('.env.') ||
    fileName === '.env.local' ||
    fileName === '.env.production' ||
    fileName === '.env.staging' ||
    fileName === '.env.development'
  ) {
    return {
      isSecret: true,
      reason: 'Environment file typically contains private credentials, API keys, and environment variables.',
    };
  }

  // SSH / Private keys
  if (
    fileName.includes('id_rsa') ||
    fileName.includes('id_ed25519') ||
    fileName.includes('id_ecdsa') ||
    fileName.endsWith('.pem') ||
    fileName.endsWith('.key') ||
    fileName.endsWith('.pfx') ||
    fileName.endsWith('.p12') ||
    fileName.endsWith('.keystore')
  ) {
    return {
      isSecret: true,
      reason: 'Private cryptographic key or certificate detected. These should never be committed to source control.',
    };
  }

  // Credentials & token files
  if (
    fileName === 'credentials.json' ||
    fileName === 'client_secret.json' ||
    fileName === 'service-account.json' ||
    fileName.includes('secret') ||
    fileName.includes('token') ||
    fileName === 'auth.json' ||
    fileName === '.npmrc' ||
    fileName === '.pypirc'
  ) {
    return {
      isSecret: true,
      reason: 'Credential configuration or token file detected. Verify this file does not contain plain secrets before staging.',
    };
  }

  return { isSecret: false };
}
