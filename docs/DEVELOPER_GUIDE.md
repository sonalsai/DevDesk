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

## 🧪 Quality Gates & CI Standards

Every contribution to DevDesk must satisfy three strict quality gates before merging:

### 1. Oxlint Linting (0 Warnings / 0 Errors Policy)
```bash
npm run lint
```
DevDesk uses Oxlint for sub-50ms static analysis across all TypeScript/TSX files. No unused variables, missing dependencies, or unhandled lint violations are permitted.

### 2. TypeScript Compilation (Strict Mode)
```bash
npx tsc -b
```
All code must compile under strict TypeScript settings with no `any` leaks or unresolved module references.

### 3. Vitest Unit Test Suite
```bash
npm run test
```
All unit tests across API execution, assertions, mock server, OpenAPI parsing, GraphQL builder, real-time protocols, and navigation history must pass with 100% success.

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

## 🏛 Core Architectural Rules

1. **Local-First & Zero Telemetry**:
   Never introduce external network telemetry, tracking pixels, or phone-home API requests. All features must function completely offline.

2. **No `eval()` or Code Execution**:
   Never use `eval()`, `new Function()`, or dynamic scripting to evaluate user data or assertions. Use recursive AST parsing and safe string manipulation.

3. **Memory Hygiene**:
   Always clean up event listeners, timers (`setInterval`), and EventSource/WebSocket subscriptions inside `useEffect` cleanup returns. Limit unbounded streaming logs to 500 entries.

4. **Visual & Aesthetic Excellence**:
   Always follow DevDesk's design system tokens (`var(--bg-app)`, `var(--bg-card)`, `var(--border-subtle)`, `var(--accent)`, `var(--text-primary)`). Maintain full compatibility with both Light (default) and Dark themes.
