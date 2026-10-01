import { lazy } from 'react';
import type { ToolDefinition } from '../types/tools';
import {
  Braces,
  Minimize2,
  ArrowRightLeft,
  KeyRound,
  Binary,
  Link2,
  Fingerprint,
  Search,
  Clock,
  Hash,
  Lock,
  GitCompare,
  FileText,
  Palette,
  Calendar,
} from 'lucide-react';

// Code-split developer tools to minimize initial bundle size and isolate runtime dependencies
const JsonFormatter = lazy(() => import('../components/tools/JsonFormatter').then((m) => ({ default: m.JsonFormatter })));
const JsonMinifier = lazy(() => import('../components/tools/JsonMinifier').then((m) => ({ default: m.JsonMinifier })));
const JsonYamlConverter = lazy(() => import('../components/tools/JsonYamlConverter').then((m) => ({ default: m.JsonYamlConverter })));
const JwtDecoder = lazy(() => import('../components/tools/JwtDecoder').then((m) => ({ default: m.JwtDecoder })));
const Base64Tool = lazy(() => import('../components/tools/Base64Tool').then((m) => ({ default: m.Base64Tool })));
const UrlEncoderTool = lazy(() => import('../components/tools/UrlEncoderTool').then((m) => ({ default: m.UrlEncoderTool })));
const UuidGenerator = lazy(() => import('../components/tools/UuidGenerator').then((m) => ({ default: m.UuidGenerator })));
const RegexTester = lazy(() => import('../components/tools/RegexTester').then((m) => ({ default: m.RegexTester })));
const TimestampTool = lazy(() => import('../components/tools/TimestampTool').then((m) => ({ default: m.TimestampTool })));
const HashGenerator = lazy(() => import('../components/tools/HashGenerator').then((m) => ({ default: m.HashGenerator })));
const PasswordGenerator = lazy(() => import('../components/tools/PasswordGenerator').then((m) => ({ default: m.PasswordGenerator })));
const TextDiffTool = lazy(() => import('../components/tools/TextDiffTool').then((m) => ({ default: m.TextDiffTool })));
const MarkdownPreviewTool = lazy(() => import('../components/tools/MarkdownPreviewTool').then((m) => ({ default: m.MarkdownPreviewTool })));
const ColorConverter = lazy(() => import('../components/tools/ColorConverter').then((m) => ({ default: m.ColorConverter })));
const CronHelper = lazy(() => import('../components/tools/CronHelper').then((m) => ({ default: m.CronHelper })));

export const TOOLS_REGISTRY: ToolDefinition[] = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, validate, minify, sort keys, and inspect JSON in code or tree view.',
    category: 'Formatters & Parsers',
    icon: Braces,
    keywords: ['json', 'format', 'prettify', 'beautify', 'validate', 'tree', 'sort'],
    component: JsonFormatter,
    isPopular: true,
  },
  {
    id: 'json-minifier',
    name: 'JSON Minifier',
    description: 'Compress JSON by stripping all unnecessary whitespace and indentation.',
    category: 'Formatters & Parsers',
    icon: Minimize2,
    keywords: ['json', 'minify', 'compress', 'shrink', 'reduction'],
    component: JsonMinifier,
    isPopular: true,
  },
  {
    id: 'json-yaml',
    name: 'JSON ↔ YAML',
    description: 'Two-way conversion between JSON and YAML configuration files.',
    category: 'Formatters & Parsers',
    icon: ArrowRightLeft,
    keywords: ['json', 'yaml', 'yml', 'convert', 'parser', 'config'],
    component: JsonYamlConverter,
    isPopular: false,
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode and inspect JSON Web Tokens (Header, Payload, Claims, Expiration).',
    category: 'Encoding & Security',
    icon: KeyRound,
    keywords: ['jwt', 'token', 'decode', 'bearer', 'auth', 'claims', 'expiration'],
    component: JwtDecoder,
    isPopular: true,
  },
  {
    id: 'base64',
    name: 'Base64',
    description: 'Encode and decode text strings to and from Base64 with URL-safe option.',
    category: 'Encoding & Security',
    icon: Binary,
    keywords: ['base64', 'encode', 'decode', 'btoa', 'atob', 'binary', 'string'],
    component: Base64Tool,
    isPopular: true,
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder / Decoder',
    description: 'Encode special URL query parameters and decode percent-encoded URLs.',
    category: 'Encoding & Security',
    icon: Link2,
    keywords: ['url', 'uri', 'encode', 'decode', 'querystring', 'percent'],
    component: UrlEncoderTool,
    isPopular: false,
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate cryptographically secure Version 4 UUIDs individually or in bulk.',
    category: 'Generators',
    icon: Fingerprint,
    keywords: ['uuid', 'guid', 'v4', 'random', 'id', 'crypto'],
    component: UuidGenerator,
    isPopular: true,
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regular expressions against target text with real-time match groups and flags.',
    category: 'Inspectors & Helpers',
    icon: Search,
    keywords: ['regex', 'regular expression', 'pattern', 'match', 'test', 'groups'],
    component: RegexTester,
    isPopular: true,
  },
  {
    id: 'timestamp',
    name: 'Timestamp Converter',
    description: 'Convert between Unix timestamps (seconds & milliseconds) and human readable dates.',
    category: 'Inspectors & Helpers',
    icon: Clock,
    keywords: ['timestamp', 'epoch', 'date', 'time', 'unix', 'iso'],
    component: TimestampTool,
    isPopular: true,
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Compute cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) for text strings.',
    category: 'Encoding & Security',
    icon: Hash,
    keywords: ['hash', 'sha256', 'sha512', 'md5', 'crypto', 'digest'],
    component: HashGenerator,
    isPopular: false,
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate strong, customizable passwords with entropy rating and symbol control.',
    category: 'Generators',
    icon: Lock,
    keywords: ['password', 'generator', 'security', 'random', 'entropy'],
    component: PasswordGenerator,
    isPopular: true,
  },
  {
    id: 'text-diff',
    name: 'Text Diff Checker',
    description: 'Side-by-side and unified diff viewer to compare two text snippets with inline highlights.',
    category: 'Inspectors & Helpers',
    icon: GitCompare,
    keywords: ['diff', 'compare', 'difference', 'delta', 'text', 'code'],
    component: TextDiffTool,
    isPopular: false,
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Preview',
    description: 'Live interactive markdown editor and HTML renderer with real-time word count.',
    category: 'Inspectors & Helpers',
    icon: FileText,
    keywords: ['markdown', 'md', 'preview', 'editor', 'render'],
    component: MarkdownPreviewTool,
    isPopular: false,
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert between HEX, RGB, and HSL color formats with preview and WCAG contrast check.',
    category: 'Inspectors & Helpers',
    icon: Palette,
    keywords: ['color', 'hex', 'rgb', 'hsl', 'contrast', 'converter'],
    component: ColorConverter,
    isPopular: false,
  },
  {
    id: 'cron-helper',
    name: 'Cron Expression Helper',
    description: 'Parse standard 5-part cron expressions into human-readable schedules with upcoming run times.',
    category: 'Inspectors & Helpers',
    icon: Calendar,
    keywords: ['cron', 'schedule', 'cronjob', 'timer', 'parse', 'interval'],
    component: CronHelper,
    isPopular: false,
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY.find((t) => t.id === id);
}

export function searchTools(query: string): ToolDefinition[] {
  if (!query.trim()) return TOOLS_REGISTRY;
  const q = query.toLowerCase().trim();
  return TOOLS_REGISTRY.filter((t) => {
    const matchName = t.name.toLowerCase().includes(q);
    const matchDesc = t.description.toLowerCase().includes(q);
    const matchCat = t.category.toLowerCase().includes(q);
    const matchKeywords = t.keywords.some((k) => k.toLowerCase().includes(q));
    return matchName || matchDesc || matchCat || matchKeywords;
  });
}

export function getToolsByCategory(): Record<string, ToolDefinition[]> {
  const groups: Record<string, ToolDefinition[]> = {};
  TOOLS_REGISTRY.forEach((tool) => {
    if (!groups[tool.category]) {
      groups[tool.category] = [];
    }
    groups[tool.category].push(tool);
  });
  return groups;
}
