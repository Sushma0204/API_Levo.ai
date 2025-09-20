```markdown
# Levo.ai Schema Upload & Versioning API Coding Assesment

## 1. Overview
This project is a coding exercise that implements a **Schema Upload and Versioning API** inspired by the requirements of Levo.ai.
Features Implemented:

* Upload OpenAPI specs (.json / .yaml)
* Version and persist uploaded schemas
* Organize schemas by application and service
* Retrieve latest / specific versions of schemas
* Get storage statistics and metadata

It is designed to mimic how schemas can be uploaded, validated, versioned, and stored for CI/CD security testing pipelines.

---

## 2. Features
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

## 3. Tech Stack
* **Node.js + Express.js** → Backend framework
* **MongoDB (Mongoose)** → Database for schema metadata
* **File System (fs)** → To persist schema files
* **YAML & JSON parsing** → For flexible spec uploads
* **Helmet, CORS, Compression** → Security & performance middlewares
* **Jest** → For testing

---

## 4. Project Structure
```

API/
├── bin/                \# Executables / CLI scripts
├── controllers/        \# Route logic (upload, fetch, versioning)
├── models/             \# Mongoose models (Schema, App, Service)
├── routes/             \# API routes
├── storage/            \# Persisted OpenAPI schema files
│   └── schemas/
├── tests/              \# Jest test cases
├── utils/              \# Helper functions (file handling, validation)
├── server.js           \# Main entry point
├── openapi.json        \# Example OpenAPI spec
├── openapi.yaml        \# Example OpenAPI spec
├── package.json        \# Dependencies & scripts
├── .env                \# Environment variables
└── README.md           \# Documentation

````

---

## 5. API Endpoints

**Base URL:** `http://localhost:3000/api`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/schemas/upload` | Upload a new schema (JSON/YAML) |
| `GET` | `/schemas/latest/:application/:service?` | Get latest schema for app/service |
| `GET` | `/schemas/version/:application/:version/:service?` | Get schema by version |
| `GET` | `/schemas/versions/:application/:service?` | List all schema versions |
| `GET` | `/applications` | List all applications |
| `GET` | `/applications/:application/services` | List all services under an app |
| `GET` | `/stats` | Show storage statistics |
| `GET` | `/health` | API health check |

---

## 6. Installation & Setup

### a. Clone the Repository
```bash
git clone [https://github.com/Sushma0204/API_Levo.ai.git](https://github.com/Sushma0204/API_Levo.ai.git)
cd API_Levo.ai
````

### b. Install Dependencies

```bash
npm install
```

### c. Configure Environment

Create a `.env` file in the root:

```
PORT=3000
MONGODB_URI=(your unique mongodb url)
MONGODB_URI_TEST=(your unique mongodb url for testing)
NODE_ENV=development
```

### d. Run the Server

```bash
npm start
```

Server runs at: `http://localhost:3000`

-----

## 7. Example Schema Upload

### With levo CLI Command

```bash
levo import --spec ./openapi.yaml --application my-app --service my-service --url http://localhost:3000
levo test --application my-app --service my-service --url http://localhost:3000

Upload response:
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
-----

## 8. Storage & Versioning

Uploaded schemas are stored under:
`storage/schemas/<application>/<service>/schema_v<version>.json|yaml`

Each upload increments the version (`v1`, `v2`, `v3`…). Previous versions are retained and retrievable.

-----

## 9. Health Check

```
GET /api/health
{"success":true,"message":"API is healthy","timestamp":"2025-09-20T07:10:24.508Z"}
```
-----
