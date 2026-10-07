# DevDesk Architecture & Engineering Specification

> **A high-performance, 100% local-first developer desktop cockpit & API workbench.**

---

## 🏛 System Overview

DevDesk is engineered to eliminate the friction and privacy vulnerabilities of cloud-dependent developer tools. All state, configurations, mock servers, and API history reside strictly within the user's browser runtime.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DevDesk Browser Runtime                         │
├────────────────────────────────┬───────────────────────────────────────┤
│        Application Shell       │          Domain View Router           │
│  - TopBar (Theme, Docs, Modals)│  - workspace/ (Home, Tasks, Scratch) │
│  - Sidebar Navigation          │  - modals/ (Privacy, Shortcuts)       │
│  - Command Palette (⌘K)        │  - api/ (REST, GraphQL, WS, SSE, Mock)│
│  - Scratchpad Floating Note    │  - git/ (Workspace, Diffs, Conflicts) │
│  - Global Keyboard Dispatcher  │  - ssh/ (Profiles, Sessions)          │
│  - i18n Locale Switcher (7)    │  - config/ (YAML, Env Files)          │
│  - Telemetry & Network Beacon  │  - logs/ (Log Viewer & Filter)        │
│                                │  - 15 Standalone Utilities            │
├────────────────────────────────┴───────────────────────────────────────┤
│                      Modular Domain Services Layer                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │     services/api/       │  │     services/git/       │              │
│  │ - apiExecutor           │  │ - gitEngine & diffs     │              │
│  │ - assertionRunner       │  │ - conflictService       │              │
│  │ - collectionRunner      │  │ - security & validation │              │
│  │ - mockServer & openApi  │  └─────────────────────────┘              │
│  │ - webSocket & sse       │  ┌─────────────────────────┐              │
│  │ - dynamicVariables      │  │   services/storage/     │              │
│  │ - environmentService    │  │ - indexedDbStorage      │              │
│  └─────────────────────────┘  │ - storageQuotaService   │              │
│  ┌─────────────────────────┐  └─────────────────────────┘              │
│  │     services/i18n/      │  ┌─────────────────────────┐              │
│  │ - i18nService (7 langs) │  │   services/interop/     │              │
│  │ - translations          │  │ - postmanConverter      │              │
│  └─────────────────────────┘  │ - harConverter          │              │
│  ┌─────────────────────────┐  └─────────────────────────┘              │
│  │  services/telemetry/    │  ┌─────────────────────────┐              │
│  │ - networkStatusService  │  │   services/config/      │              │
│  │ - systemTelemetryService│  │ - envFileService, yaml  │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
├────────────────────────────────────────────────────────────────────────┤
│                       Browser Storage & Network                        │
│   • LocalStorage (DevDesk Workspace V5)                                │
│   • IndexedDB Resilience Engine (`DevDeskEnterpriseDB` v1)             │
│   • Native Fetch API / WebSocket / EventSource                         │
│   • Zero Remote Telemetry / Zero Cloud Backends                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Modular Domain Folder Organization

DevDesk's codebase is structured around high-cohesion, low-coupling domain modules with clean barrel exports (`index.ts`) for both services and views:

```text
src/
├── components/
│   ├── shell/           # AppShell, TopBar, Sidebar, CommandPalette
│   ├── common/          # ErrorBoundary, Modal, ConfirmDialog, CodeEditor
│   ├── tools/           # 15 standalone utilities
│   └── views/           # Modular Domain Views
│       ├── workspace/   # HomeDashboard, Scratchpad, Tasks, Projects, Snippets, Tools
│       ├── modals/      # PrivacyModal, ShortcutsModal
│       ├── api/         # ApiClient, Graphql, WebSocket, Sse, MockServer, OpenApi, Runner
│       ├── git/         # GitWorkspaceView, DiffViewer, ConflictEditor, DiscardModal
│       ├── ssh/         # SshWorkspaceView
│       ├── config/      # YamlToolkitView
│       ├── logs/        # LogViewer
│       ├── SettingsView.tsx
│       ├── DocsGuideView.tsx
│       └── index.ts     # Master views barrel export
├── services/            # Domain Business Logic
│   ├── api/             # API executor, assertions, mock server, OpenAPI, WS, SSE, runner
│   ├── git/             # Local git engine, diffs, conflicts, branch validation
│   ├── ssh/             # SSH connection profiles and configuration
│   ├── config/          # .env file manager, YAML tokenizer and converter
│   ├── logs/            # Log parser, severity filter, search engine
│   ├── storage/         # IndexedDB fallback engine, quota sentinel, LRU pruner
│   ├── i18n/            # 7-locale translation engine and formatters
│   ├── interop/         # Postman v2.1 & HAR 1.2 lossless converters
│   ├── telemetry/       # Network status sentinel and web vitals monitor
│   ├── storage.ts       # Core workspace persistence & v1-v5 schema migrations
│   ├── navigation.ts    # Workspace navigation history stack
│   └── index.ts         # Master domain services barrel export
├── context/             # WorkspaceContext, I18nContext
├── hooks/               # useWorkspace, useTranslation, useToast
├── registry/            # Tools registry and category configurations
├── types/               # TypeScript models & schemas
└── utils/               # Date, math, ID generation helpers
```

---

## 🔒 Security & Privacy Standard

1. **Zero Cloud Telemetry**:
   DevDesk includes zero analytics tracking, zero third-party telemetry scripts, and zero phone-home mechanisms. All operations happen in-process on the developer's client.

2. **Zero `eval()` Policy**:
   Test assertions and JSONPath queries never execute `eval()`, `new Function()`, or dynamic scripting. Assertions are resolved via deterministic recursive AST navigation (`assertionRunner.ts`), eliminating arbitrary code execution risks.

3. **Credential & History Sanitization**:
   When storing API requests to history:
   - Sensitive authorization headers (`Authorization`, `Bearer ...`) are masked with bullet characters (`••••••••••••`).
   - Passwords and auth secret objects are omitted from local request logs.

4. **Safe Workspace Export**:
   Exporting workspace state provides an option to strip environment secrets (`api_key`, `secret`, `token`), preventing accidental credential leaks in team Git repositories.

---

## ⚡ Performance & Bundle Optimization

DevDesk achieves a lean production footprint through systematic bundle hygiene:

- **Vendor Chunking**: External libraries (`lucide-react`, `yaml`, `react`) are separated into stable cache chunks.
- **Dynamic View Splitting**: Heavy views such as `DocsGuideView`, `OpenApiExplorerView`, `GraphqlView`, `GitWorkspaceView`, and all 15 utilities are loaded lazily via `React.lazy()` and `Suspense`.
- **Fast Build Times**: Sub-200ms production builds with Vite and Oxlint sub-80ms static checks.
- **Memory Safeguards**: Real-time streaming views (WebSocket and SSE) enforce a strict 250-to-500-message circular buffer cap, preventing browser memory leaks during high-frequency streams.

---

## 💾 Storage Architecture & Migration Pipeline

DevDesk uses a versioned schema stored in `localStorage` under key `devdesk_workspace_v3` (running Schema Version 5):

```typescript
export interface WorkspaceState {
  version: 5;
  activeEnvironmentId: string | null;
  environments: Environment[];
  collections: Collection[];
  apiHistory: ApiHistoryItem[];
  tasks: Task[];
  snippets: Snippet[];
  projects: Project[];
  scratchpad: ScratchpadNote;
  settings: UserSettings;
  mockRoutes: MockRoute[];
}
```

The migration engine (`src/services/storage.ts`) automatically validates and migrates older data structures (v1 through v4) without data loss, ensuring seamless upgrades across versions.

---

## 🌐 Global Enterprise Standards Architecture

### 1. Global Multi-Language System (i18n)
DevDesk includes a native typed internationalization engine (`src/services/i18n/`) supporting 7 global languages:
- 🇺🇸 English (`en`)
- 🇪🇸 Spanish (`es`)
- 🇯🇵 Japanese (`ja`)
- 🇩🇪 German (`de`)
- 🇫🇷 French (`fr`)
- 🇨🇳 Simplified Chinese (`zh`)
- 🇮🇳 Hindi (`hi`)

Features instant locale switching, `<html lang>` synchronization, localized date/time formatting (`Intl.DateTimeFormat`), relative time (`Intl.RelativeTimeFormat`), byte metrics, and regional number separators with zero external bundle bloat.

### 2. Hybrid Storage Resilience & Quota Sentinel
- **IndexedDB Fallback**: High-capacity blob and emergency snapshot engine (`DevDeskEnterpriseDB` v1) prevents data loss from browser `QuotaExceededError`.
- **Storage Quota Sentinel**: Real-time storage estimation via `navigator.storage.estimate()` with visual warning thresholds (70% and 90%).
- **LRU History Pruning**: Automatically prunes oldest API history records when local storage limits are reached.
- **SHA-256 Checksum Verification**: Cryptographically verifies workspace backups upon export and import to guarantee zero data corruption.

### 3. Industry API Interoperability (Postman v2.1 & HAR 1.2)
- **Postman Collection v2.1**: Import and export collections with preserved folders, headers, variables, bearer/basic auth, and request payloads.
- **HTTP Archive (HAR 1.2)**: Direct import from Chrome/Firefox DevTools network recordings and export for security auditing.
- **Dynamic System Macros**: Native resolution of standard Postman macros (`{{$guid}}`, `{{$timestamp}}`, `{{$isoTimestamp}}`, `{{$randomInt}}`, `{{$randomEmail}}`, `{{$randomIp}}`, etc.).

### 4. Automated Batch Collection Runner & CI/CD Reports
- Sequential request execution with dynamic request chaining and assertion evaluation.
- Live progress monitoring and latency percentile calculation (min, max, avg, P95).
- One-click export of **JUnit XML** for GitHub Actions / GitLab CI and JSON test execution reports.

### 5. Client Telemetry & Local Network Sentinel
- Local Core Web Vitals monitor (TTFB, DOM nodes, memory heap usage, composite health score).
- Live network connectivity indicator with pulsating status beacon and offline resilience mode.
