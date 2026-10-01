# DevDesk OpenAPI & Swagger 3.0 / 3.1 Guide

> **Universal JSON/YAML specification parser, automatic collection generator, environment mapper, and interactive documentation explorer.**

---

## 📖 Overview

DevDesk bridges the gap between API specifications and hands-on testing. Instead of manually copying paths, headers, and request bodies from Swagger UI into an API client, DevDesk lets you import OpenAPI 3.0 & 3.1 documents with one shortcut (`⌘ + ⇧ + I` / `Ctrl + Shift + I`).

---

## 📥 Import Methods

You can import OpenAPI documents into DevDesk via three methods:

1. **File Upload**: Drag-and-drop or browse for `.json`, `.yaml`, or `.yml` files.
2. **Raw Text / Clipboard**: Paste raw JSON or YAML text directly into the importer editor.
3. **Remote URL**: Enter any publicly accessible OpenAPI endpoint URL (e.g. `https://petstore3.swagger.io/v3/openapi.json`).

---

## 🔍 Validation & Import Preview

Before committing the import, DevDesk displays a structured validation summary:
- **API Metadata**: Title, Version, and Description.
- **Server Targets**: Detected base URLs for production, staging, and development.
- **Endpoint Operations**: Total number of endpoints grouped by HTTP method (`GET`, `POST`, `PUT`, `DELETE`).
- **Data Schemas**: Object definitions and data models declared in `components/schemas`.
- **Warning Log**: Any syntax or structural errors in the specification are highlighted before importing.

---

## ⚡ Automatic Collection & Request Generation

When you confirm an import:
1. DevDesk creates a dedicated **Collection** named after the API specification.
2. Every operation (`path` + `method`) is converted into an executable `ApiRequest`:
   - URL path parameters (`/users/{id}`) are converted into DevDesk path templates (`/users/:id`).
   - Query parameters, header definitions, and content-type headers are pre-populated.
   - Example request bodies defined in the schema are converted into structured JSON payloads.
   - Tags defined in the spec are preserved as folder categories.

---

## 🌐 Server to Environment Mapping

OpenAPI specifications typically declare one or more server endpoints:

```yaml
servers:
  - url: https://api.production.acme.com/v1
    description: Production Server
  - url: https://api.staging.acme.com/v1
    description: Staging Server
```

DevDesk automatically maps these entries:
- A new DevDesk **Environment** is created (e.g. `Acme API - Production`).
- The `base_url` variable is populated with the server's root URL.
- Generated collection requests reference `{{base_url}}/endpoint`, allowing you to toggle between production and staging instantly.

---

## 📚 Interactive Documentation Explorer

The **OpenAPI Explorer** (`src/components/views/api/OpenApiExplorerView.tsx`) provides a clean, searchable documentation reader:
- **Tag Filtering**: Filter endpoints by service module or tag (`Users`, `Billing`, `Webhooks`).
- **HTTP Method Badges**: Color-coded badges (`GET` in green, `POST` in blue, `PUT` in orange, `DELETE` in red).
- **Schema Inspector**: Inspect object fields, types, required flags, and nested references.
- **1-Click Testing**: Click **"Open in API Client"** on any endpoint to instantly load the request into the HTTP workbench, pre-filled with parameters and headers.
