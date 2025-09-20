# Levo.ai Schema Upload & Versioning API Coding Assessment

## Overview

This project is a coding exercise that implements a **Schema Upload and Versioning API** inspired by the requirements of Levo.ai. It is designed to mimic how schemas can be uploaded, validated, versioned, and stored for CI/CD security testing pipelines.

### Features Implemented

* Upload OpenAPI specs (.json / .yaml)
* Version and persist uploaded schemas
* Organize schemas by application and service
* Retrieve latest / specific versions of schemas
* Get storage statistics and metadata

---

## Features

* Upload OpenAPI spec (YAML/JSON)
* Automatic schema validation before upload
* Versioning of schemas per application/service
* Replace schema for existing application/service
* Retrieve:
    * Latest schema
    * Specific version
    * All versions
* Files persisted in a storage directory (`/storage/schemas`)
* MongoDB for metadata storage
* REST API endpoints with structured error handling
* Basic unit tests included

---

## Tech Stack

* **Node.js + Express.js** → Backend framework
* **MongoDB (Mongoose)** → Database for schema metadata
* **File System (fs)** → To persist schema files
* **YAML & JSON parsing** → For flexible spec uploads
* **Helmet, CORS, Compression** → Security & performance middlewares
* **Jest** → For testing

---

## Project Structure

```
API/
├── bin/                # Executables / CLI scripts
├── controllers/        # Route logic (upload, fetch, versioning)
├── models/             # Mongoose models (Schema, App, Service)
├── routes/             # API routes
├── storage/            # Persisted OpenAPI schema files
│   └── schemas/
├── tests/              # Jest test cases
├── utils/              # Helper functions (file handling, validation)
├── server.js           # Main entry point
├── openapi.json        # Example OpenAPI spec
├── openapi.yaml        # Example OpenAPI spec
├── package.json        # Dependencies & scripts
├── .env                # Environment variables
└── README.md           # Documentation
```

---

## API Endpoints

**Base URL:** `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/schemas/upload` | Upload a new schema (JSON/YAML) |
| `GET` | `/api/schemas/latest/:application/:service?` | Get latest schema for app/service |
| `GET` | `/api/schemas/version/:application/:version/:service?` | Get schema by version |
| `GET` | `/api/schemas/versions/:application/:service?` | List all schema versions |
| `GET` | `/api/applications` | List all applications |
| `GET` | `/api/applications/:application/services` | List all services under an app |
| `GET` | `/api/stats` | Show storage statistics |
| `GET` | `/api/health` | API health check |

---

## Installation & Setup

### Clone the Repository

```bash
git clone https://github.com/Sushma0204/API_Levo.ai.git
cd API_Levo.ai
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create a `.env` file in the root:

```
PORT=3000
MONGODB_URI=(your unique mongodb url)
MONGODB_URI_TEST=(your unique mongodb url for testing)
```

### Run the Server

```bash
npm start
```

Server runs at: `http://localhost:3000`

---

## Example Schema Upload

### With levo CLI Command

```bash
levo import --spec ./openapi.yaml --application my-app --service my-service --url http://localhost:3000
levo test --application my-app --service my-service --url http://localhost:3000
```

Upload response:

```json
{
  "success": true,
  "message": "Schema uploaded successfully",
  "data": {
    "application": "my-app",
    "service": "my-service",
    "version": 4,
    "isNewVersion": true,
    "metadata": {
      "openApiVersion": "3.0.0",
      "title": "Booking API",
      "version": "1.0.0",
      "servers": [
        "http://127.0.0.1:9000/api"
      ],
      "pathsCount": 2,
      "componentsCount": 1
    }
  }
}
```

---

## Storage & Versioning

Uploaded schemas are stored under:
```
storage/schemas/<application>/<service>/schema_v<version>.json|yaml
```

Each upload increments the version (`v1`, `v2`, `v3`…). Previous versions are retained and retrievable.

---

## Health Check

```
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2025-09-20T07:10:24.508Z"
}
```

## All Applications

```
GET /api/applications
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "68ce38ebd56d30e7650c187c",
      "name": "my-app",
      "createdAt": "2025-09-20T05:17:31.470Z",
      "updatedAt": "2025-09-20T05:17:31.477Z"
    }
  ]
}
```

## Stats

```
GET /api/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "database": {
      "applications": 1,
      "services": 1,
      "schemaVersions": 4
    },
    "fileSystem": {
      "totalApplications": 1,
      "totalServices": 1,
      "totalSchemas": 6
    }
  }
}

```

