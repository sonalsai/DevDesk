# DevDesk API Testing & Assertions Guide

> **Declarative, synchronous, zero-`eval` test runner, automated batch execution, and request chaining engine.**

---

## 🎯 Design Philosophy

Traditional API clients often rely on JavaScript code sandboxes (e.g. `pm.test(...)` or `eval()`) to evaluate response tests. While flexible, this introduces:
- Potential security vulnerabilities (arbitrary script injection).
- Performance overhead and memory leaks.
- Fragile scripts across workspace sharing.

DevDesk utilizes a **pure declarative assertion model** evaluated by an internal recursive AST interpreter (`src/services/api/assertionRunner.ts`). Assertions execute deterministically with sub-millisecond execution times and zero security risks.

---

## 📋 Supported Assertion Types

DevDesk natively supports 8 assertion types:

| Assertion Type | Target | Description | Example Configuration |
| :--- | :--- | :--- | :--- |
| `status_code` | Status Code | Exact HTTP status match | `ASSERT status == 200` |
| `status_2xx` | Status Range | Matches any HTTP 200..299 status code | `ASSERT status in 2xx` |
| `response_time` | Latency SLA | Maximum roundtrip latency in milliseconds | `ASSERT response_time < 300` |
| `json_path_exists` | Response Body | Verifies nested JSONPath property exists | `ASSERT $.data.user.id exists` |
| `json_path_equals` | Response Body | Validates exact property value (string/number/bool) | `ASSERT $.data.user.role == "admin"` |
| `header_exists` | Headers | Case-insensitive header existence check | `ASSERT header "x-ratelimit-remaining" exists` |
| `header_equals` | Headers | Validates exact header value or substring match | `ASSERT header "content-type" equals "application/json"` |
| `body_contains` | Raw Body | Substring match against raw text response | `ASSERT body contains "success"` |

---

## 🔍 JSONPath Syntax & Resolution

DevDesk's JSONPath engine handles nested property exploration with support for:

- **Root Prefix**: Both `$.data.user` and `data.user` are valid.
- **Nested Objects**: Dot notation (`$.company.address.city`).
- **Array Indexing**: Numeric bracket notation (`$.items[0].id` or `$.users[2].email`).
- **Mixed Navigation**: `$.organizations[0].members[1].profile.name`.

### Value Comparison Rules
When using `json_path_equals`:
- Numbers: Compared numerically (e.g., `42 == 42`).
- Booleans: Compared as strict booleans (`true == true`, `false == false`).
- Strings: Compared with exact casing or trimmed strings.
- Objects/Arrays: Serialized to stable JSON for equality matching.

---

## 🔗 Request Chaining (Variable Extraction)

Request chaining allows you to extract dynamic values from a response and immediately write them into active Environment variables for downstream API calls.

### Workflow:
1. Open the **Tests & Chaining** tab in the API Client.
2. Under **Request Chaining**, specify:
   - **Source JSONPath**: e.g., `$.auth.access_token`
   - **Target Variable Name**: e.g., `AUTH_TOKEN`
3. Execute the request (`⌘ + Enter`).
4. Upon successful response:
   - The token is extracted via recursive JSONPath lookup.
   - The value is persisted directly into the active environment.
   - Downstream requests referencing `Bearer {{AUTH_TOKEN}}` will immediately resolve the newly acquired token.

---

## 🚀 Automated Batch Collection Runner & CI/CD Reports

DevDesk includes a built-in batch test runner (`src/services/api/collectionRunner.ts`) accessible directly from Collections Manager:

1. **Batch Execution**: Runs all requests in a collection in sequential order.
2. **Variable Chaining**: Applies extractions dynamically so downstream requests in the batch receive extracted tokens from earlier requests.
3. **Statistical Metrics**: Real-time pass/fail rates, minimum latency, maximum latency, average latency, and **P95 Latency**.
4. **CI/CD Integration**:
   - **JUnit XML Report**: 1-click export of `junit.xml` conforming to standard CI/CD test reporting formats (GitHub Actions, GitLab CI, Jenkins).
   - **JSON Summary**: Structured JSON test run results for archival or dashboard ingestion.

---

## 🧪 Testing in CI or Unit Tests

The test runner engine is thoroughly verified with unit tests in `tests/assertions.test.ts` and `tests/interop.test.ts`. You can run the entire assertion test suite locally with:

```bash
npm run test tests/assertions.test.ts
```
