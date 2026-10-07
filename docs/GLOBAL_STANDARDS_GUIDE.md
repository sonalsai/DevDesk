# DevDesk Global Standards & Enterprise Interoperability Specification

> **Comprehensive guide to DevDesk's enterprise-grade standards: internationalization (i18n), Postman & HAR interoperability, automated batch runner with JUnit XML, hybrid IndexedDB resilience, and local telemetry.**

---

## 🌍 1. Native Internationalization Engine (i18n)

DevDesk includes an enterprise-grade, typed internationalization engine (`src/services/i18n/`) engineered with **zero external dependencies** to eliminate bundle bloat while supporting 7 global developer locales.

### Supported Locales

| Locale Code | Language | Native Name | Default Direction |
| :--- | :--- | :--- | :--- |
| `en` | English (Default) | English | LTR |
| `es` | Spanish | Español | LTR |
| `ja` | Japanese | 日本語 | LTR |
| `de` | German | Deutsch | LTR |
| `fr` | French | Français | LTR |
| `zh` | Simplified Chinese | 简体中文 | LTR |
| `hi` | Hindi | हिन्दी | LTR |

### Architecture & Capabilities
1. **Dynamic Locale Switching**: Available in the TopBar locale selector and the Settings view. Switching locales immediately updates the document root (`<html lang="...">`), rerenders localized strings, and persists the user preference across sessions.
2. **Deterministic Fallbacks**: If a translation key is missing in a target locale, the engine automatically falls back to English (`en`), preventing blank labels or UI breaks.
3. **Native Formatters**:
   - `formatDate(date, options)`: Uses `Intl.DateTimeFormat` tailored to the active locale.
   - `formatRelativeTime(isoString)`: Uses `Intl.RelativeTimeFormat` for natural phrases (e.g. "2 hours ago", "hace 2 horas", "2時間前").
   - `formatBytes(bytes)`: Locale-aware digital storage scaling (B, KB, MB, GB, TB).
   - `formatNumber(value)`: Regional thousand separators and decimal formatting.

---

## 🔄 2. Postman v2.1 & HAR 1.2 Interoperability

DevDesk seamlessly integrates into existing enterprise API workflows by providing lossless two-way import and export with standard industry formats.

### Postman Collection Format (v2.1)
- **Import Engine** (`src/services/interop/postmanConverter.ts`):
  - Converts Postman collections, folders, and request items into DevDesk `ApiCollection` and `ApiRequest` objects.
  - Automatically translates query parameters, custom HTTP headers, Bearer tokens, Basic auth credentials, and request bodies (`raw`, `json`, `urlencoded`, `formdata`).
  - Converts Postman environment exports (`{ values: [...] }`) into DevDesk environments.
- **Export Engine**:
  - Exports any DevDesk collection to standard Postman v2.1 schema JSON (`schema.getpostman.com/json/collection/v2.1.0/collection.json`) for instant sharing with teammates.

### HTTP Archive Format (HAR 1.2)
- **Import Engine** (`src/services/interop/harConverter.ts`):
  - Ingests browser network recordings exported from Google Chrome, Mozilla Firefox, or Safari DevTools (`.har` files).
  - Automatically reconstructs exact URLs, methods, headers, and payloads as reproducible API client requests.
- **Export Engine**:
  - Exports collection requests to standard HAR 1.2 for compliance audits, security logging, and API reproduction.

### Dynamic Postman System Macros
DevDesk includes native client-side resolution for standard dynamic system macros (`src/services/api/dynamicVariables.ts`):

| Macro Variable | Resolved Value Description |
| :--- | :--- |
| `{{$guid}}` | High-entropy RFC 4122 v4 UUID |
| `{{$timestamp}}` | Current UNIX epoch timestamp in seconds |
| `{{$isoTimestamp}}` | ISO 8601 UTC timestamp string |
| `{{$randomInt}}` | Cryptographically random integer (0..1000) |
| `{{$randomEmail}}` | Synthetic test email address (`dev.*@example.com`) |
| `{{$randomIp}}` | Synthetic IPv4 address |
| `{{$randomColor}}` | Random HEX color code |
| `{{$randomCity}}` | Representative global city name |
| `{{$randomCountry}}`| Representative global country name |

---

## 🧪 3. Automated Batch Collection Runner & CI/CD Export

The Batch Collection Runner (`src/services/api/collectionRunner.ts`) allows developers to execute multi-step API test suites without leaving the browser.

### Key Capabilities
1. **Sequential Execution & Request Chaining**:
   - Executes each request in a collection sequentially with configurable inter-request delay (0ms – 1000ms).
   - Evaluates assertions dynamically at each step.
   - Extracts response variables via JSONPath and pipes them into active environment state for subsequent requests in the chain.
2. **Live Test Progress & Percentiles**:
   - Real-time progress bar with live pass/fail counts.
   - Computes statistical latency percentiles: Minimum, Maximum, Average, and **P95 Latency**.
3. **CI/CD Integration Reports**:
   - **JUnit XML Report** (`generateJUnitXmlReport`): Standard JUnit XML format compatible with GitHub Actions, GitLab CI, Jenkins, and Azure DevOps test reporters.
   - **JSON Summary Export**: Full structured execution report for machine archiving.

---

## 🛡️ 4. Hybrid Storage Resilience & Quota Sentinel

To ensure mission-critical workspace persistence without data loss, DevDesk employs a dual-engine storage strategy (`src/services/storage/`).

### Storage Engines
1. **Primary: Versioned LocalStorage**: Fast synchronous workspace reads and writes under key `devdesk_workspace_v3` (Schema Version 5).
2. **Secondary: IndexedDB Resilience Engine (`indexedDbStorage.ts`)**:
   - Uses `DevDeskEnterpriseDB` (v1) with object stores `workspace_snapshots` and `audit_logs`.
   - Automatically saves asynchronous emergency checkpoints on every workspace update.
   - Provides seamless fallback when `localStorage` encounters browser quota limits.

### Storage Quota Sentinel (`storageQuotaService.ts`)
- Continuously queries `navigator.storage.estimate()` to calculate total used bytes and available quota.
- Displays visual warning indicators when browser storage exceeds 70% or 90% capacity.
- **LRU History Pruning**: When storage usage approaches the limit, the sentinel automatically purges the oldest API history items (`ApiHistoryItem[]`), preserving all user collections, environments, tasks, and snippets.
- **SHA-256 Checksum Verification**: Every backup export file includes a cryptographic SHA-256 signature calculated via Web Crypto API. During import, the signature is verified before restoring state, preventing corruption.

---

## 📊 5. In-Browser Client Telemetry & Local Network Sentinel

DevDesk includes zero-cloud client observability tools (`src/services/telemetry/`) to monitor client health in real time:

1. **System Telemetry**:
   - Monitors Core Web Vitals and browser DOM load: Time to First Byte (TTFB), total active DOM nodes, and JS heap memory usage.
   - Computes an aggregate performance health score (0–100) with statuses (`optimal`, `good`, `degraded`).
2. **Local Network Sentinel**:
   - Real-time online/offline network detection (`navigator.onLine` and `navigator.connection`).
   - Measures connection downlink speed, round-trip time (RTT), and effective connection type (4G/3G).
   - Displays a pulsating status beacon in the TopBar with offline graceful fallback mode.
