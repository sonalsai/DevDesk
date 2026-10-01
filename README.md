# DevDesk — All-in-One Developer Workspace

> **Fast, focused, local-first developer cockpit.**  
> Built for software engineers who value speed, privacy, and aesthetic visual excellence.

[![Tests](https://img.shields.io/badge/tests-20%20passing-brightgreen.svg)](#)
[![Lint](https://img.shields.io/badge/lint-0%20warnings-brightgreen.svg)](#)
[![Bundle](https://img.shields.io/badge/entry%20bundle-91%20kB%20(22%20kB%20gz)-blue.svg)](#)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20local--first-success.svg)](#)

---

## 🌟 Overview

**DevDesk** brings together everyday engineering utilities, task management, code snippets, project tracking, and a full-featured REST API testing suite into a unified, distraction-free environment.

- **Local-First & Private**: All data stays in your browser's local storage. Zero tracking, zero telemetry, and zero third-party database dependencies.
- **"Floating Islands" Aesthetic**: Modern glassmorphism, responsive bento grids, curated color palettes, smooth spring animations, and full dark/light theme support.
- **Instant Keyboard Navigation**: Command Palette (`Cmd/Ctrl + K`), Vim/Mac-style history stack navigation (`Alt + Left/Right` or `Cmd/Ctrl + [ / ]`), quick task creation (`N`), and scratchpad shortcut (`S`).
- **High-Performance Architecture**: Modular domain layers, dynamic code-splitting with sub-100 kB initial payload, and resilient Error Boundaries to guarantee zero unsaved data loss.

---

## 🚀 Features

### 1. Developer Utilities Suite (15 Tools)
- **JSON Formatter & Validator**: Beautify, validate, format, sort keys, and inspect JSON in interactive tree view.
- **JSON Minifier**: Strip whitespace and compress payloads for production.
- **JSON ↔ YAML Converter**: Bidirectional conversion powered by the `yaml` engine (dynamically loaded on demand).
- **JWT Decoder**: Decode headers and payloads, inspect claims, format timestamps, and check token expiration status.
- **Base64 Encoder / Decoder**: Standard and URL-safe Base64 conversions.
- **URL Encoder / Decoder**: Percent-encode and decode URI components and query strings.
- **UUID Generator**: Cryptographically secure Version 4 UUID generation (single or bulk batch up to 100).
- **Regex Tester**: Real-time expression evaluation with group capture extraction and flag controls (`g`, `i`, `m`, `s`).
- **Timestamp Converter**: Live synchronized epoch conversions (seconds and milliseconds), ISO strings, and relative times.
- **Hash Generator**: Cryptographic hash calculation (MD5, SHA-1, SHA-256, SHA-512) via Web Crypto API.
- **Password Generator**: High-entropy password creation with customizable character sets and strength meters.
- **Text Diff Checker**: Side-by-side and unified diff visualization with inline additions and deletions.
- **Markdown Preview**: Live split editor with real-time GitHub-flavored Markdown rendering, word counts, and HTML export.
- **Color Converter**: HEX, RGB, and HSL conversions with live palette previews and WCAG contrast ratio calculations.
- **Cron Expression Helper**: Visual 5-part cron parser with human-readable schedules and upcoming execution forecasts.

### 2. Full REST API Suite
- **API Client**: Multi-tab HTTP client with method selectors (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`), URL parameter editor, header management, Bearer/Basic/API-Key authentication, and JSON/Form/Multipart body support.
- **Dynamic Variable Interpolation**: Environment variables (`{{base_url}}`, `{{api_key}}`) resolved automatically at runtime with masking for secrets.
- **Environments Manager**: Create, clone, and manage dev/staging/prod configurations, export `.env` templates with masked secrets, and compare variable drift.
- **Collections & Requests**: Hierarchical organization of saved requests with instant loading and duplication.
- **cURL Toolkit**: Import raw cURL commands directly into structured API requests; generate clean, copy-pasteable cURL commands from active tabs.
- **Multi-Language Code Generator**: Export active API requests to executable code snippets in JavaScript (`fetch`), Python (`requests`), Go (`net/http`), and cURL.
- **HTTP Header & CORS Inspector**: Diagnose remote endpoint response headers, caching directives (`Cache-Control`, `ETag`), security headers (`HSTS`, `CSP`), and CORS permissions.
- **Webhook Inspector**: Local webhook receiver simulator with event logging, header inspections, payload replay, and filtering.

### 3. Productivity & Workspace Modules
- **Home Dashboard**: Bento grid overview with greeting, daily progress indicators, quick-access tools, and recent activity feed.
- **Scratchpad**: Persistent developer notepad with auto-save indicators, pin state, and word metrics.
- **Task Manager**: Kanban/list task planner with status tracking (`todo`, `in_progress`, `done`), priorities (`low`, `medium`, `high`), due dates, and project tags.
- **Code Snippets**: Tagged multi-language snippet repository with instant copy-to-clipboard and search.
- **Project Hub**: Organize tasks, snippets, API collections, environments, and external links under unified project umbrellas.

---

## 🏗 Architecture & Code Structure

DevDesk is structured according to scalable production standards:

```
src/
├── components/
│   ├── common/           # Reusable UI primitives (ErrorBoundary, LoadingFallback, Modal, ConfirmDialog, CodeEditor)
│   ├── shell/            # Application layout (AppShell, TopBar, Sidebar, CommandPalette)
│   ├── tools/            # 15 Isolated, lazy-loaded developer tools
│   └── views/            # Main workspace view containers
│       └── api/          # API Client suite (ApiClient, Collections, Environments, Webhooks, HttpInspector)
├── context/              # Context definitions & provider components (Fast Refresh compliant)
│   ├── toastContextDef.ts
│   ├── ToastContext.tsx
│   ├── workspaceContextDef.ts
│   └── WorkspaceContext.tsx
├── hooks/                # Dedicated custom hooks (useToast, useWorkspace) with barrel export
├── registry/             # Tool definitions with dynamic lazy loading
├── services/             # Pure business logic and domain services
│   ├── apiExecutor.ts    # Fetch engine, header/url resolution, history sanitizer
│   ├── codeGenerator.ts  # Multi-language snippet generator
│   ├── curlParser.ts     # cURL CLI parser and reverse generator
│   ├── environmentService.ts # Variable interpolation and diffing
│   ├── httpStatusReference.ts # Standard RFC HTTP status metadata
│   ├── navigation.ts     # Pure immutable navigation history stack
│   └── storage.ts        # LocalStorage persistence, migrations, backup/restore
├── types/                # Strict TypeScript interfaces and schemas
└── utils/                # Pure formatting and date/ID utilities
```

### Performance & Bundle Hygiene
- **Sub-100 kB Entry Bundle**: All views and heavy third-party dependencies (such as the `yaml` parser) are dynamically imported via `React.lazy` and `Suspense`.
- **Manual Vendor Chunking**: React runtimes, Lucide icons, and YAML parsing are split into distinct, long-term cacheable chunks in `vite.config.ts`.
- **Fault-Tolerant Error Boundaries**: Any runtime exception within an isolated view or utility is trapped without crashing the shell or losing unsaved scratchpad data.
- **Path Aliases**: Clean `@/*` imports configured across TypeScript, Vite, and Vitest.

---

## 🛠 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation & Run

```bash
# Clone and enter the repository
git clone https://github.com/your-username/DevDesk.git
cd DevDesk

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

### Development Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite HMR dev server at `http://localhost:5173` |
| `npm run build` | Validates TypeScript (`tsc -b`) and bundles production assets |
| `npm run lint` | Runs Oxlint linter with 0 warnings/errors policy |
| `npm run test` | Executes Vitest test suite |
| `npm run preview` | Locally serves the production `dist/` build |

---

## 🔒 Security & Privacy Model

- **No Remote Telemetry**: DevDesk makes no network calls other than the explicit HTTP requests triggered inside the API Client or HTTP Inspector.
- **Sanitized History**: When recording API history, authorization headers and Bearer tokens are masked (`••••••••••••`) and sensitive credential objects are omitted.
- **Safe Exporting**: When generating workspace backup files, DevDesk offers secret-masking so credentials are never accidentally committed to public repositories.

---

## 📄 License

MIT License. Designed and engineered for the modern software developer.
