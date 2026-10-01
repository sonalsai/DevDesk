# DevDesk Local Mock Server Guide

> **Zero-backend API route simulation, multi-scenario responses, and latency testing directly inside your browser.**

---

## 🚀 Why a Local Mock Server?

Frontend engineers and API developers often hit roadblocks when:
- Backend services are under active development and not yet deployed.
- Staging environments are unstable or rate-limited.
- Edge cases (401 Unauthorized, 404 Not Found, 500 Internal Error) are difficult to trigger reliably from real APIs.
- Testing slow networks (e.g. 1500ms delay) requires manual throttling configurations.

DevDesk solves this by providing an **in-browser Mock Server** (`src/services/mockServer.ts`) that simulates REST endpoints with instant scenario switching and realistic latency.

---

## 🛡 The Honest Simulation Standard

DevDesk adheres to the **Honest Simulation Standard**:
- Web browsers cannot bind arbitrary operating system TCP ports (e.g., port 8080) from client-side JavaScript.
- Instead of pretending to launch a native TCP daemon, DevDesk routes mock requests internally through its client engine and service layer with full route matching, path parameter extraction, latency delay, and audit logging.
- Every simulated response automatically injects the header `x-devdesk-mock: true` and includes accurate roundtrip timing.

---

## 🛠 Defining Mock Routes & Parameterized Paths

### 1. Static Routes
A static route matches exact URL paths:
- Method: `GET`
- Path: `/api/v1/system/status`
- Response: `{"status": "operational", "uptime": 99.98}`

### 2. Parameterized Routes (`:param`)
DevDesk supports dynamic route segments prefixed with a colon (`:`):
- Method: `GET`
- Path: `/api/v1/users/:id`
- Requesting `/api/v1/users/42` or `/api/v1/users/usr_99` will resolve to this route.
- Parameter values are extracted into route metadata.

---

## 🎭 Multi-Scenario Responses

Each mock route can contain multiple pre-configured scenarios. This allows you to test both the "happy path" and complex error conditions in one click:

| Scenario Name | Status Code | Default | Example Payload |
| :--- | :--- | :--- | :--- |
| `Success (200)` | `200 OK` | Yes | `{"id": 42, "name": "Jane Doe", "role": "admin"}` |
| `Not Found (404)` | `404 Not Found` | No | `{"error": "User with requested ID does not exist"}` |
| `Validation Error (400)` | `400 Bad Request`| No | `{"error": "Invalid user ID format"}` |
| `Server Crash (500)` | `500 Server Error` | No | `{"error": "Internal database connection timeout"}` |

### Toggling Scenarios:
1. Navigate to **Local Mock Server** from the sidebar or press `⌘K` → `Local Mock Server`.
2. Locate your route in the route table.
3. Click on the scenario badge or select from the dropdown to designate the **Active Scenario**.
4. Future requests to that path will return the newly active scenario immediately.

---

## ⏱ Simulated Latency & Delay Testing

To test UI loading spinners, skeleton screens, and timeout handlers:
- Configure **Response Delay (ms)** on any route or scenario (0ms to 5,000ms).
- When a request is triggered, DevDesk holds the response for the specified duration before resolving.
- The client measures and reports the simulated network latency.

---

## 📜 Audit Log & History

Every simulated request dispatched through the mock server is recorded in the **Mock Request Log**:
- Timestamp (millisecond precision).
- HTTP Method & Path.
- Matched Route ID & Scenario Name.
- Elapsed latency.
- Request headers and query parameters.
- Response status code and byte payload size.

Clear or export the audit log with one click from the Mock Server toolbar.
