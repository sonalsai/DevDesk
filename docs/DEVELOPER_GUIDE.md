# DevDesk Developer & Contributor Guide

> **Guidelines for contributing, extending developer tools, running tests, and upholding architecture standards.**

---

## 🚀 Development Quickstart

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Setup Commands
```bash
# Clone and enter the workspace
git clone https://github.com/your-username/DevDesk.git
cd DevDesk

# Install dependencies
npm install

# Start local development server with Vite HMR
npm run dev
```

The application will be live at `http://localhost:5173`.

---

## 🏛 Codebase Modular Domain Architecture

DevDesk organizes business logic and user interfaces into domain modules:

```text
src/
├── services/
│   ├── api/         # HTTP execution, assertions, OpenAPI, WebSocket, SSE, runner
│   ├── git/         # Git engine, diffs, conflict resolution, security
│   ├── ssh/         # SSH connection profiles and session manager
│   ├── config/      # .env file manager, YAML tokenizer and converter
│   ├── logs/        # Log parser, severity filters, search
│   ├── storage/     # IndexedDB fallback, storage quota sentinel, LRU pruning
│   ├── i18n/        # 7-locale translation engine and native formatters
│   ├── interop/     # Postman v2.1 & HAR 1.2 converters
│   ├── telemetry/   # Network status sentinel and web vitals monitor
│   └── index.ts     # Master services barrel
└── components/
    └── views/
        ├── workspace/ # Home, Scratchpad, Tasks, Projects, Snippets, Tools
        ├── modals/    # PrivacyModal, ShortcutsModal
        ├── api/       # API testing suite views
        ├── git/       # Git workspace and diff views
        ├── ssh/       # SSH workspace views
        ├── config/    # YAML toolkit views
        ├── logs/      # Log viewer views
        └── index.ts   # Master views barrel
```

Always import from path aliases (e.g. `@/services`, `@/hooks`, `@/types`) to ensure clean dependency boundaries.

---

## 🧪 Quality Gates & CI Standards

Every contribution to DevDesk must satisfy three strict quality gates before merging:

### 1. Oxlint Linting (0 Warnings / 0 Errors Policy)
```bash
npm run lint
```
DevDesk uses Oxlint for sub-80ms static analysis across all TypeScript/TSX files. No unused variables, missing dependencies, or unhandled lint violations are permitted.

### 2. TypeScript Compilation (Strict Mode)
```bash
npx tsc -b
```
All code must compile under strict TypeScript settings with no `any` leaks or unresolved module references.

### 3. Vitest Unit Test Suite (123+ Passing Tests)
```bash
npm run test
```
All 123+ unit tests across API execution, assertions, mock server, OpenAPI parsing, GraphQL builder, real-time protocols, i18n, Postman & HAR interop, and storage resilience must pass with 100% success.

---

## 🛠 Adding a New Developer Utility

DevDesk's modular registry architecture makes it easy to introduce new standalone developer utilities:

### Step 1: Create the Component
Create a new TSX file under `src/components/tools/YourNewTool.tsx`:
```tsx
import React, { useState } from 'react';

export const YourNewTool: React.FC = () => {
  const [input, setInput] = useState('');

  return (
    <div className="tool-container">
      <h3>Your New Tool</h3>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} />
    </div>
  );
};

export default YourNewTool;
```

### Step 2: Register in `src/registry/toolsRegistry.ts`
Add the tool metadata to `TOOLS_REGISTRY`:
```typescript
{
  id: 'your-tool-id',
  name: 'Your Tool Name',
  description: 'Concise description of the utility',
  category: 'converters', // 'formatters' | 'encoders' | 'inspectors' | 'converters'
  icon: 'Wrench',
  keywords: ['keyword1', 'keyword2'],
  component: React.lazy(() => import('@/components/tools/YourNewTool')),
}
```

The tool will automatically appear in:
- The sidebar utility list
- The global Command Palette (`⌘K`)
- The Home Dashboard quick-access grid
- The in-app Documentation & Tools Guide (`DocsGuideView`)

---

## 🔒 Security Guidelines

- **Zero `eval()`**: Never evaluate string code in assertions or templates.
- **Local Sandbox**: Never introduce external cloud tracking scripts or remote analytics SDKs.
- **Credential Masking**: Ensure secret tokens and authorization headers are sanitized when saving state.
