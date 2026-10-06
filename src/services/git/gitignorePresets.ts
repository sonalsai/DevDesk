export interface GitignorePreset {
  id: string;
  name: string;
  category: 'Languages' | 'Frameworks' | 'Tools & Infrastructure' | 'Environment & OS';
  description: string;
  patterns: string[];
}

export const GITIGNORE_PRESETS: GitignorePreset[] = [
  {
    id: 'node',
    name: 'Node.js & NPM / Yarn / Pnpm',
    category: 'Languages',
    description: 'Dependencies, lockfile variants, npm debug logs, and build artifacts',
    patterns: [
      'node_modules/',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      '.pnpm-store/',
      '.npm',
      '.yarn/cache',
      '.yarn/unplugged',
      '.yarn/build-state.yml',
    ],
  },
  {
    id: 'react-vite',
    name: 'React & Vite',
    category: 'Frameworks',
    description: 'Vite build output directory, dev server cache, and TypeScript builds',
    patterns: [
      'dist/',
      'dist-ssr/',
      '*.local',
      '.vite/',
      '*.tsbuildinfo',
      '.eslintcache',
    ],
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'Frameworks',
    description: 'Next.js build cache, telemetry, and exported standalone bundles',
    patterns: [
      '.next/',
      'out/',
      '.next/cache/',
      'next-env.d.ts',
    ],
  },
  {
    id: 'python',
    name: 'Python',
    category: 'Languages',
    description: 'Bytecode, virtualenvs, __pycache__, mypy, pytest, and dist artifacts',
    patterns: [
      '__pycache__/',
      '*.py[cod]',
      '*$py.class',
      '.venv/',
      'venv/',
      'env/',
      'ENV/',
      '*.egg-info/',
      '.eggs/',
      'dist/',
      'build/',
      '.pytest_cache/',
      '.mypy_cache/',
      '.ruff_cache/',
    ],
  },
  {
    id: 'java',
    name: 'Java & Gradle / Maven',
    category: 'Languages',
    description: 'Class files, Gradle wrapper build artifacts, and Maven target directories',
    patterns: [
      '*.class',
      '*.jar',
      '*.war',
      '*.ear',
      'target/',
      'build/',
      '.gradle/',
      'gradle-app.setting',
      '!gradle-wrapper.jar',
    ],
  },
  {
    id: 'go',
    name: 'Go',
    category: 'Languages',
    description: 'Compiled binaries, test outputs, and vendor folders',
    patterns: [
      '*.exe',
      '*.exe~',
      '*.dll',
      '*.so',
      '*.dylib',
      'bin/',
      'dist/',
      '*.test',
      'vendor/',
    ],
  },
  {
    id: 'rust',
    name: 'Rust / Cargo',
    category: 'Languages',
    description: 'Cargo target artifacts and debug build symbols',
    patterns: [
      'target/',
      '**/*.rs.bk',
      'Cargo.lock',
    ],
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'Tools & Infrastructure',
    description: 'Docker temp files, compose overrides, and container secrets',
    patterns: [
      '.docker/',
      'docker-compose.override.yml',
      '*.dockerignore',
    ],
  },
  {
    id: 'env-files',
    name: 'Environment & Secrets (.env)',
    category: 'Environment & OS',
    description: 'Prevent leaking local secrets, tokens, API keys, and environment files',
    patterns: [
      '.env',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      '*.env',
      '*.pem',
      '*.key',
      'credentials.json',
      'secrets.yaml',
    ],
  },
  {
    id: 'os-system',
    name: 'Operating System (macOS & Windows)',
    category: 'Environment & OS',
    description: 'macOS .DS_Store, Windows Thumbs.db, desktop.ini, and spotfiles',
    patterns: [
      '.DS_Store',
      '.DS_Store?',
      '._*',
      '.Spotlight-V100',
      '.Trashes',
      'ehthumbs.db',
      'Thumbs.db',
      'desktop.ini',
    ],
  },
  {
    id: 'ides',
    name: 'IDEs (VS Code, JetBrains, Sublime)',
    category: 'Tools & Infrastructure',
    description: 'Workspace state, history, editor configs, and project metadata',
    patterns: [
      '.vscode/*',
      '!.vscode/settings.json',
      '!.vscode/tasks.json',
      '!.vscode/launch.json',
      '!.vscode/extensions.json',
      '.idea/',
      '*.suo',
      '*.ntvs*',
      '*.njsproj',
      '*.sln',
      '*.swp',
      '*~',
    ],
  },
];

/**
 * Combines selected preset IDs and custom patterns into a clean .gitignore document.
 */
export function generateGitignoreContent(
  selectedPresetIds: string[],
  customPatterns: string[] = []
): string {
  const chunks: string[] = [
    '# Created by DevDesk .gitignore Helper',
    `# Generated: ${new Date().toISOString().split('T')[0]}`,
    '',
  ];

  for (const id of selectedPresetIds) {
    const preset = GITIGNORE_PRESETS.find((p) => p.id === id);
    if (!preset) continue;

    chunks.push(`### ${preset.name} ###`);
    for (const pattern of preset.patterns) {
      chunks.push(pattern);
    }
    chunks.push('');
  }

  if (customPatterns.length > 0) {
    chunks.push('### Custom Patterns ###');
    for (const pat of customPatterns) {
      if (pat.trim()) chunks.push(pat.trim());
    }
    chunks.push('');
  }

  return chunks.join('\n');
}
