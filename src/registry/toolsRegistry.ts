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

import { JsonFormatter } from '../components/tools/JsonFormatter';
import { JsonMinifier } from '../components/tools/JsonMinifier';
import { JsonYamlConverter } from '../components/tools/JsonYamlConverter';
import { JwtDecoder } from '../components/tools/JwtDecoder';
import { Base64Tool } from '../components/tools/Base64Tool';
import { UrlEncoderTool } from '../components/tools/UrlEncoderTool';
import { UuidGenerator } from '../components/tools/UuidGenerator';
import { RegexTester } from '../components/tools/RegexTester';
import { TimestampTool } from '../components/tools/TimestampTool';
import { HashGenerator } from '../components/tools/HashGenerator';
import { PasswordGenerator } from '../components/tools/PasswordGenerator';
import { TextDiffTool } from '../components/tools/TextDiffTool';
import { MarkdownPreviewTool } from '../components/tools/MarkdownPreviewTool';
import { ColorConverter } from '../components/tools/ColorConverter';
import { CronHelper } from '../components/tools/CronHelper';

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
    keywords: ['uuid', 'guid', 'v4', 'random', 'id', 'generate', 'bulk'],
    component: UuidGenerator,
    isPopular: true,
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regular expressions live with match highlighting, capture groups, and presets.',
    category: 'Inspectors & Helpers',
    icon: Search,
    keywords: ['regex', 'regexp', 'regular expression', 'pattern', 'test', 'match'],
    component: RegexTester,
    isPopular: true,
  },
  {
    id: 'timestamp',
    name: 'Timestamp Converter',
    description: 'Convert Unix epoch timestamps to human dates, UTC, ISO 8601, and local time.',
    category: 'Inspectors & Helpers',
    icon: Clock,
    keywords: ['timestamp', 'epoch', 'unix', 'time', 'date', 'iso', 'utc', 'milliseconds'],
    component: TimestampTool,
    isPopular: true,
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Compute cryptographic SHA-256, SHA-384, and SHA-512 hashes locally.',
    category: 'Encoding & Security',
    icon: Hash,
    keywords: ['hash', 'sha256', 'sha384', 'sha512', 'checksum', 'digest', 'crypto'],
    component: HashGenerator,
    isPopular: false,
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate cryptographically strong passwords with entropy calculations.',
    category: 'Generators',
    icon: Lock,
    keywords: ['password', 'generate', 'random', 'secure', 'crypto', 'entropy', 'token'],
    component: PasswordGenerator,
    isPopular: false,
  },
  {
    id: 'text-diff',
    name: 'Text Diff',
    description: 'Compare two text or code documents and inspect additions, removals, and changes.',
    category: 'Inspectors & Helpers',
    icon: GitCompare,
    keywords: ['diff', 'compare', 'difference', 'text', 'code', 'merge', 'changes'],
    component: TextDiffTool,
    isPopular: false,
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Preview',
    description: 'Write and render GitHub-Flavored Markdown with tables, code, and task lists.',
    category: 'Formatters & Parsers',
    icon: FileText,
    keywords: ['markdown', 'md', 'preview', 'gfm', 'render', 'editor', 'notes'],
    component: MarkdownPreviewTool,
    isPopular: false,
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert colors between HEX, RGB, RGBA, HSL, HSV with preview and contrast.',
    category: 'Inspectors & Helpers',
    icon: Palette,
    keywords: ['color', 'hex', 'rgb', 'rgba', 'hsl', 'hsv', 'contrast', 'picker'],
    component: ColorConverter,
    isPopular: false,
  },
  {
    id: 'cron-helper',
    name: 'Cron Helper',
    description: 'Translate cron expressions into human schedules, build crons, and preview runs.',
    category: 'Inspectors & Helpers',
    icon: Calendar,
    keywords: ['cron', 'schedule', 'tab', 'time', 'interval', 'job', 'timer'],
    component: CronHelper,
    isPopular: false,
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY.find((t) => t.id === id);
}
