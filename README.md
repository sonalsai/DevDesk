# DevDesk — The Modern All-in-One Developer Workspace & API Desk

> **Fast, focused, private, and local-first developer cockpit.**  
> Built for software engineers who value speed, privacy, and aesthetic visual excellence.

[![Tests](https://img.shields.io/badge/tests-123%20passing-brightgreen.svg)](#)
[![Lint](https://img.shields.io/badge/lint-0%20warnings-brightgreen.svg)](#)
[![Bundle](https://img.shields.io/badge/entry%20bundle-103%20kB%20(25%20kB%20gz)-blue.svg)](#)
[![TypeScript](https://img.shields.io/badge/typescript-strict%205.x-blue.svg)](#)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20local--first-success.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](#)

---

## 🌟 Overview

**DevDesk** transforms your browser into a complete developer desktop environment. Instead of context-switching between 10+ open browser tabs, desktop HTTP clients, mock utilities, and CLI tools, DevDesk unifies everything into one seamless, privacy-first workspace:

```text
API Specification (OpenAPI / Swagger / Postman v2.1 / HAR 1.2)
       ↓
Import / Explore Schemas & Docs
       ↓
Organized Collections & Environments
       ↓
Execute Protocols (REST / GraphQL / WebSocket / SSE / Batch Runner)
       ↓
Local Mock Server Simulation (Zero Backend)
       ↓
Declarative Assertions & Automated Testing (JUnit XML CI/CD)
       ↓
Request Chaining & Variable Extraction
       ↓
Inspect Results, Telemetry & Web Vitals
```

- **100% Local-First & Private**: Everything runs in your browser. Zero cloud telemetry, zero remote tracking, and zero credentials sent to third parties.
- **Global Multi-Language (i18n)**: 7 global languages (English, Spanish, Japanese, German, French, Simplified Chinese, Hindi) with native formatting.
- **Postman v2.1 & HAR 1.2 Interoperability**: Seamless two-way import and export of Postman collections, HTTP Archive network captures, and dynamic system variables (`{{$guid}}`, `{{$timestamp}}`).
- **Automated Collection Runner**: Sequential batch test execution with dynamic request chaining and instant **JUnit XML** export for CI/CD pipelines.
- **Hybrid Storage Resilience & Quota Sentinel**: IndexedDB emergency checkpoints, automatic LRU history pruning, and cryptographic SHA-256 backup integrity checks.
- **Full Real-Time & API Suite**: REST, GraphQL (with live Introspection & Query Builder), WebSocket, and Server-Sent Events (SSE).
- **In-Browser Mock Server**: Simulate backend endpoints with parameterized paths (`/users/:id`), multi-scenarios (`200 OK`, `400 Bad Request`, `404 Not Found`), and configurable latency without needing a live backend.
- **OpenAPI 3.0 & 3.1 Importer**: Universal JSON/YAML parser that generates collections, maps servers to environments, and provides browsable API documentation.
- **Declarative Testing Engine**: Pure recursive JSONPath assertions (status, headers, latency, response bodies) executed synchronously with **zero `eval()`**.
- **15 Daily Developer Utilities**: Built-in formatters, JWT decoder, regex tester, UUID/hash generators, cron helper, diff checker, and converters.
- **Keyboard-First Experience**: Global command palette (`⌘K`), quick-action shortcuts (`⌘↵`, `⌘⇧I`, `⌥←`), scratchpad shortcut (`S`), and task creation (`N`).
- **PWA & Accessibility (WCAG AA)**: Installable Progressive Web App with offline indicator, screen reader skip-links, and keyboard navigation.

---

## 📚 Documentation Directory

Explore the in-depth technical guides and specifications:

| Guide | Description |
| :--- | :--- |
| [**Architecture & Engineering**](file:///Users/sonal-aot/Desktop/DevDesk/docs/ARCHITECTURE.md) | System design, runtime model, zero-`eval` security sandbox, v1–v5 storage migrations, and code-splitting |
| [**Global Standards & Interoperability**](file:///Users/sonal-aot/Desktop/DevDesk/docs/GLOBAL_STANDARDS_GUIDE.md) | 7-locale i18n engine, Postman v2.1 & HAR 1.2 interop, collection batch runner, JUnit XML, and IndexedDB sentinel |
| [**API Testing & Assertions**](file:///Users/sonal-aot/Desktop/DevDesk/docs/API_TESTING_GUIDE.md) | Declarative assertion engine, all 8 assertion types, recursive JSONPath resolution, and request chaining |
| [**Local Mock Server**](file:///Users/sonal-aot/Desktop/DevDesk/docs/MOCK_SERVER_GUIDE.md) | Browser-based mock server, `:param` route matching, multi-scenario responses, latency simulation, and audit logs |
| [**OpenAPI & Swagger 3.0 / 3.1**](file:///Users/sonal-aot/Desktop/DevDesk/docs/OPENAPI_GUIDE.md) | Universal JSON/YAML parser, automatic collection generator, server-to-environment mapping, and interactive docs |
| [**Real-Time Protocols (WS & SSE)**](file:///Users/sonal-aot/Desktop/DevDesk/docs/REALTIME_PROTOCOLS.md) | Full-duplex WebSocket frame streaming, persistent EventSource listeners, buffer management, and troubleshooting |
| [**Developer & Contributor Guide**](file:///Users/sonal-aot/Desktop/DevDesk/docs/DEVELOPER_GUIDE.md) | Contributing guidelines, adding new utilities to `TOOLS_REGISTRY`, quality gates (Oxlint, Vitest, TSC) |

---

## 🚀 Complete Feature Breakdown

### 1. Real-Time Streaming & Protocols
* **WebSocket Client (`ws://`, `wss://`)**:
  * Persistent connection lifecycle (`disconnected`, `connecting`, `connected`, `error`) with measurable handshake latency.
  * Split-panel interface: live frame stream with direction filters (`Inbound`, `Outbound`, `System`, `Error`), millisecond timestamps, and byte metrics.
  * Message composer supporting JSON validation, minification, formatting, and environment variable resolution (`{{base_url}}`).
  * 500-message memory cap protection with a 1-click **Clear Stream** button.
  * Saved WebSocket connection presets organized inside Collections.
* **Server-Sent Events (SSE) Client**:
  * Persistent `EventSource` stream subscriptions over `http://` and `https://`.
  * Dedicated event log displaying `message`, `open`, `error`, and custom named events.
  * Full-text stream search, payload copying, and automated reconnection handling.

### 2. GraphQL Explorer & Schema Introspection
* **Document Workspace**: Query and mutation editor with syntax highlighting, variables editor, custom request headers, and environment interpolation.
* **Live Introspection**: Automatically queries `__schema` metadata to discover public object types, fields, arguments, and scalar definitions.
* **Interactive Query Builder**: Visual schema tree allowing developers to click any type or field to automatically generate valid GraphQL query documents.
* **Error Separation**: Accurately distinguishes transport/network errors, HTTP 4xx/5xx status codes, and GraphQL specification-compliant `errors` arrays.

### 3. Local Mock Server (In-Browser Simulation)
* **Route Matching Engine**: Supports static paths (`/api/v1/users`) and parameterized routes (`/api/v1/users/:id`).
* **Multi-Scenario Responses**: Define and toggle multiple scenarios per route (`200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Server Error`).
* **Simulated Delay**: User-defined response delays (0ms – 5000ms) with header injection (`x-devdesk-mock: true`) to test slow-network states.
* **Honest Simulation Standard**: Completely browser-safe; never claims to bind arbitrary TCP ports in browser JavaScript.
* **Request Audit Log**: Chronological log of simulated requests capturing method, path, latency, headers, and query parameters.

### 4. OpenAPI / Swagger 3.0 & 3.1 Integration
* **Universal Parser**: Fast parsing of both JSON and YAML OpenAPI specifications.
* **Validation Preview**: Pre-import inspection showing title, version, server URLs, endpoint count, parameters, schemas, and error warnings.
* **Collection Generation**: Transforms OpenAPI operations into structured DevDesk Collections with parameterized routes, headers, and request bodies.
* **Environment Mapping**: Automatically maps declared OpenAPI servers into DevDesk environments with resolved `base_url` variables.
* **Interactive Explorer**: Searchable API documentation view with HTTP method badges, tag filtering, schema property inspectors, and a 1-click **"Open in API Client"** workflow.

### 5. API Testing & Assertions Engine (Zero `eval()`)
* **Secure Declarative Assertions**:
  1. `status_code`: Exact HTTP status matching.
  2. `status_2xx`: Success range verification.
  3. `response_time`: Latency threshold enforcement in milliseconds.
  4. `header_exists`: Case-insensitive verification of header presence.
  5. `header_equals`: Exact or substring header value matching.
  6. `json_path_exists`: Recursive nested property validation (`$.user.roles[0]`).
  7. `json_path_equals`: Value comparison for numbers, booleans, and strings.
  8. `body_contains`: Substring matching across raw or JSON body content.
* **Request Chaining**: Extract values via JSONPath (e.g. `$.auth.token`) and write them directly into active environment variables for downstream calls.
* **API Client Integration**: Dedicated **Tests** tab with 1-click preset templates, live pass/fail status pill in the response toolbar, and structured test result tables.

### 6. REST API Client & Environments
* **Multi-Tab Workspace**: Tabbed HTTP workbench with method selectors (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`), URL parameter editor, header management, and body types (JSON, Form Data, Multipart, Raw).
* **Authentication**: Bearer Token, API Key, and Basic Auth.
* **Dynamic Variable Interpolation**: Environment variables (`{{base_url}}`, `{{api_key}}`) resolved automatically at runtime.
* **Environments Manager**: Create, clone, and manage dev/staging/prod configurations, export `.env` templates with masked secrets, and compare variable drift.
* **Collections & History**: Hierarchical organization of saved requests with instant loading and duplication.
* **cURL Toolkit**: Import raw cURL commands directly into structured API requests; generate clean, copy-pasteable cURL commands from active tabs.
* **Multi-Language Code Generator**: Export active API requests to executable code snippets in JavaScript (`fetch`), Python (`requests`), Go (`net/http`), and cURL.
* **HTTP Header & Webhook Inspectors**: Diagnose remote endpoint response headers and simulate local webhook receivers with event logging and payload replay.

### 7. Developer Utilities Suite (15 Tools)
* **Formatters & Parsers**: JSON Formatter & Validator, JSON Minifier, JSON ↔ YAML Converter.
* **Encoding & Security**: JWT Decoder (claims & expiration), Base64 Encoder/Decoder, URL Encoder/Decoder, Cryptographic Hash Generator (MD5, SHA-1, SHA-256, SHA-512), Password Generator.
* **Inspectors & Helpers**: UUID v4 Generator (single or batch up to 100), Regex Tester (real-time group capture), Timestamp Converter (epoch, ISO, relative), Text Diff Checker (side-by-side & unified), Markdown Preview (GitHub-flavored split editor), Color Converter (HEX, RGB, HSL with WCAG contrast ratios), Cron Expression Helper (human-readable schedule translation).

### 8. Productivity & Workspace Modules
* **Home Dashboard**: Bento grid overview with greeting, daily progress indicators, quick-access tools, and recent activity feed.
* **Scratchpad**: Persistent developer notepad with auto-save indicators, pin state, and word metrics.
* **Task Manager**: Kanban/list task planner with status tracking (`todo`, `in_progress`, `done`), priorities (`low`, `medium`, `high`), due dates, and project tags.
* **Code Snippets**: Tagged multi-language snippet repository with instant copy-to-clipboard and search.
* **Project Hub**: Organize tasks, snippets, API collections, environments, and external links under unified project umbrellas.
* **App Overview & Guide (`DocsGuideView`)**: Master documentation and interactive tour accessible from the top navbar (`BookOpen` icon) and Home Dashboard.

---

## 🏗 Architecture & Code Structure

```text
docs/
├── ARCHITECTURE.md        # Technical architecture, security model, and v1-v5 migrations
├── GLOBAL_STANDARDS_GUIDE.md # 7-locale i18n, Postman & HAR interop, batch runner, JUnit XML
├── API_TESTING_GUIDE.md   # Zero-eval declarative assertions, JSONPath, and request chaining
├── MOCK_SERVER_GUIDE.md   # Local mock server, parameterized routes, and multi-scenarios
├── OPENAPI_GUIDE.md       # OpenAPI 3.0 & 3.1 parser, collections generator, and docs explorer
├── REALTIME_PROTOCOLS.md  # WebSocket and SSE frame streaming and 250-message buffer capping
└── DEVELOPER_GUIDE.md     # Contributor guide, quality gates, and tool creation
src/
├── components/
│   ├── common/           # Reusable UI primitives (ErrorBoundary, LoadingFallback, Modal, CodeEditor)
│   ├── shell/            # Application layout (AppShell, TopBar, Sidebar, CommandPalette)
│   ├── tools/            # 15 Isolated, lazy-loaded developer tools
│   └── views/            # Modular Domain View Components
│       ├── workspace/    # HomeDashboard, Tasks, Scratchpad, Projects, Snippets, Tools, Recent
│       ├── modals/       # PrivacyModal, ShortcutsModal
│       ├── api/          # API workbench (Client, GraphQL, WS, SSE, Mock, OpenAPI, Batch Runner)
│       ├── git/          # Local Git Workspace, DiffViewer, ConflictEditor
│       ├── ssh/          # SSH Terminal Profiles & Workspace
│       ├── config/       # YAML Toolkit & .env files
│       ├── logs/         # Log Viewer & search filters
│       ├── SettingsView.tsx # General settings & 7-locale language switcher
│       ├── DocsGuideView.tsx# Master interactive documentation & tour
│       └── index.ts      # Master views barrel
├── context/              # WorkspaceContext, I18nContext providers
├── hooks/                # Custom hooks (useWorkspace, useTranslation, useToast)
├── registry/             # Tool definitions with dynamic lazy loading
├── services/             # Modular Domain Business Logic
│   ├── api/              # Execution, assertions, batch runner, mock server, OpenAPI, WS, SSE
│   ├── git/              # Git engine, branch validation, diff calculation, conflict editor
│   ├── ssh/              # SSH connection management
│   ├── config/           # YAML formatting/conversion and .env file handling
│   ├── logs/             # Log parser and filtering
│   ├── storage/          # IndexedDB fallback engine, quota sentinel, LRU history pruner
│   ├── i18n/             # 7-locale translation dictionary and native formatters
│   ├── interop/          # Lossless Postman v2.1 & HAR 1.2 importers/exporters
│   ├── telemetry/        # Network status sentinel and web vitals monitor
│   ├── storage.ts        # LocalStorage persistence, migrations (v1-v5), backup/restore
│   ├── navigation.ts     # Immutable navigation history stack
│   └── index.ts          # Master services barrel
├── types/                # Strict TypeScript interfaces and schemas
└── utils/                # Pure formatting and date/ID utilities
tests/
├── api.test.ts           # API Client, variable interpolation, cURL, migrations
├── assertions.test.ts    # All 8 assertion types, recursive JSONPath, request chaining
├── git.test.ts           # Git branch management, staging, commits, diffs
├── graphql.test.ts       # GraphQL query builder and introspection schema tests
├── i18n.test.ts          # 7-language localization, formatters, and HTML sync
├── integrations.test.ts  # Workspace integration test flows
├── interop.test.ts       # Postman v2.1 & HAR 1.2 import/export and macros
├── mockServer.test.ts    # Local mock server route matching, latency, request logs
├── navigation.test.ts    # Navigation history stack and view transitions
├── openApi.test.ts       # OpenAPI 3.0/3.1 JSON & YAML parsing, collection generation
├── realtime.test.ts      # WebSocket and SSE protocol validation, subscriptions, lifecycle
└── storageResilience.test.ts # IndexedDB fallback, storage quota, SHA-256 integrity
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `⌘ + K` (or `Ctrl + K`) | Open Global Command Palette & Tool Finder | Anywhere |
| `⌘ + Enter` (or `Ctrl + Enter`) | Execute API Request / GraphQL Query / Send WS message | API Client, GraphQL, WebSocket |
| `⌘ + ⇧ + I` (or `Ctrl + Shift + I`) | Open OpenAPI / Swagger Specification Importer | Anywhere |
| `⌥ + ←` (or `Alt + Left`) | Navigate back to previous view | Anywhere |
| `S` | Quick-open persistent Scratchpad notes | Global (outside inputs) |
| `N` | Quick-focus New Task creation | Global (outside inputs) |
| `/` | Trigger Command Palette search | Global (outside inputs) |
| `Esc` | Close modals, overlays, or search palettes | Any open overlay |

---

## 🛠 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/your-username/DevDesk.git
cd DevDesk

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

The application will be running at `http://localhost:5173`.

### Development Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite HMR dev server at `http://localhost:5173` |
| `npm run build` | Validates TypeScript (`tsc -b`) and bundles production assets |
| `npm run lint` | Runs Oxlint linter with 0 warnings/errors policy |
| `npm run test` | Executes the Vitest unit test suite (57 tests) |
| `npm run preview` | Locally serves the production `dist/` build |

---

## 🔒 Security & Privacy Model

- **Zero Remote Telemetry**: DevDesk makes no background network calls. All data, tokens, and inputs remain 100% in your browser.
- **No `eval()` Policy**: JSONPath evaluation, assertion checks, and template interpolations are executed via pure recursive AST parsers with zero arbitrary JavaScript execution.
- **Sanitized History**: When recording API history, authorization headers and Bearer tokens are masked (`••••••••••••`) and sensitive credential objects are omitted.
- **Safe Exporting**: When generating workspace backup files, secret masking prevents credentials from being committed to public repositories.

---

## 📄 License

MIT License. Designed and engineered for the modern software developer.
