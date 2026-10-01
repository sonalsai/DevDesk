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
│  - TopBar (Theme, Docs, Modals)│  - HomeDashboard (Bento Grid)         │
│  - Sidebar Navigation          │  - DocsGuideView (Interactive Docs)   │
│  - Command Palette (⌘K)        │  - ApiClientView (REST + Tests)       │
│  - Scratchpad Floating Note    │  - GraphqlView (Schema Explorer)      │
│  - Global Keyboard Dispatcher  │  - WebSocketView (Frame Stream)       │
│                                │  - SseView (EventSource Stream)       │
│                                │  - MockServerView (Local Router)      │
│                                │  - OpenApiExplorerView (Swagger 3.1)  │
│                                │  - 15 Standalone Utilities            │
├────────────────────────────────┴───────────────────────────────────────┤
│                            Core Services                               │
│  ┌────────────────────┐ ┌────────────────────┐ ┌─────────────────────┐ │
│  │   assertionRunner  │ │     mockServer     │ │    openApiParser    │ │
│  │  (Zero-eval AST)   │ │  (:param matcher)  │ │ (JSON & YAML 3.1)   │ │
│  └────────────────────┘ └────────────────────┘ └─────────────────────┘ │
│  ┌────────────────────┐ ┌────────────────────┐ ┌─────────────────────┐ │
│  │  graphqlExecutor   │ │  webSocketManager  │ │     sseManager      │ │
│  │ (Introspect + AST) │ │ (500-frame cap)    │ │ (Named EventSource) │ │
│  └────────────────────┘ └────────────────────┘ └─────────────────────┘ │
│  ┌────────────────────┐ ┌────────────────────┐ ┌─────────────────────┐ │
│  │    apiExecutor     │ │ environmentService │ │      storage        │ │
│  │(Fetch + Sanitizer) │ │(Interpolation/Diff)│ │(v1-v5 Migrations)   │ │
│  └────────────────────┘ └────────────────────┘ └─────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│                       Browser Storage & Network                        │
│   • LocalStorage (DevDesk Workspace V5)                                │
│   • Native Fetch API / WebSocket / EventSource                         │
│   • Zero Remote Telemetry / Zero Cloud Backends                        │
└────────────────────────────────────────────────────────────────────────┘
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

- **Vendor Chunking**: External libraries (`lucide-react`, UI helpers) are separated into stable cache chunks.
- **Dynamic View Splitting**: Heavy views such as `DocsGuideView`, `OpenApiExplorerView`, `GraphqlView`, and all 15 utilities are loaded lazily via `React.lazy()` and `Suspense`.
- **Fast Build Times**: Uses Vite 5 + ESBuild for sub-second hot-module replacement and instant unit test feedback with Vitest.
- **Memory Safeguards**: Real-time streaming views (WebSocket and SSE) enforce a strict 500-message circular buffer cap, preventing browser memory leaks during high-frequency streams.

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
