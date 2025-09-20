import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import { Application, Service, SchemaVersion } from '../models/index.js';
import 'dotenv/config';

// Test database
const MONGODB_URI_TEST = process.env.MONGODB_URI_TEST;

const sampleOpenApiSchema = {
  openapi: "3.0.0",
  info: {
    title: "Test API",
    version: "1.0.0",
    description: "A test API for unit testing"
  },
  servers: [
    {
      url: "https://api.test.com/v1"
    }
  ],
  paths: {
    "/users": {
      get: {
        summary: "Get users",
        responses: {
          "200": {
            description: "List of users"
          }
        }
      }
    },
    "/users/{id}": {
      get: {
        summary: "Get user by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        responses: {
          "200": {
            description: "User details"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: {
            type: "integer"
          },
          name: {
            type: "string"
          }
        }
      }
    }
  }
};

describe('Levo Schema API', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingApp = await Application.findOne({ name: 'test-app' });
    if (!existingApp) {
      await Application.create({ name: 'test-app' });
    }
  });

  beforeEach(async () => {
    await Application.deleteMany({});
    await Service.deleteMany({});
    await SchemaVersion.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API is healthy');
    });
  });

  describe('POST /api/schemas/upload', () => {
    it('should upload a new schema for application only', async () => {
      const schemaBuffer = Buffer.from(JSON.stringify(sampleOpenApiSchema, null, 2));

      const response = await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .attach('spec', schemaBuffer, 'openapi.json')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application).toBe('test-app');
      expect(response.body.data.version).toBe(1);
      expect(response.body.data.isNewVersion).toBe(true);

      const appDoc = await Application.findOne({ name: 'test-app' });
      expect(appDoc).toBeTruthy();

      const schemaVersion = await SchemaVersion.findOne({
        application: 'test-app',
        service: null
      });
      expect(schemaVersion).toBeTruthy();
      expect(schemaVersion.version).toBe(1);
      expect(schemaVersion.isLatest).toBe(true);
    });

    it('should upload a new schema for application with service', async () => {
      const schemaBuffer = Buffer.from(JSON.stringify(sampleOpenApiSchema, null, 2));

      const response = await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .field('service', 'user-service')
        .attach('spec', schemaBuffer, 'openapi.json')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application).toBe('test-app');
      expect(response.body.data.service).toBe('user-service');
      expect(response.body.data.version).toBe(1);

      const service = await Service.findOne({
        name: 'user-service',
        application: 'test-app'
      });
      expect(service).toBeTruthy();
    });

    it('should create new version when schema changes', async () => {
      const schemaBuffer = Buffer.from(JSON.stringify(sampleOpenApiSchema, null, 2));

      await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .attach('spec', schemaBuffer, 'openapi.json')
        .expect(201);

      const modifiedSchema = {
        ...sampleOpenApiSchema,
        info: { ...sampleOpenApiSchema.info, version: '2.0.0' }
      };
      const modifiedBuffer = Buffer.from(JSON.stringify(modifiedSchema, null, 2));

      const response = await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .attach('spec', modifiedBuffer, 'openapi.json')
        .expect(201);

      expect(response.body.data.version).toBe(2);
      expect(response.body.data.isNewVersion).toBe(true);

      const versions = await SchemaVersion.find({ application: 'test-app' });
      expect(versions.length).toBe(2);

      const latestVersions = await SchemaVersion.find({
        application: 'test-app',
        isLatest: true
      });
      expect(latestVersions.length).toBe(1);
      expect(latestVersions[0].version).toBe(2);
    });

    it('should not create new version when schema is unchanged', async () => {
      const schemaBuffer = Buffer.from(JSON.stringify(sampleOpenApiSchema, null, 2));

      await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .attach('spec', schemaBuffer, 'openapi.json')
        .expect(201);

      const response = await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .attach('spec', schemaBuffer, 'openapi.json')
        .expect(200);

      expect(response.body.data.version).toBe(1);
      expect(response.body.data.isNewVersion).toBe(false);
      expect(response.body.message).toBe('Schema unchanged, no new version created');
    });

    it('should validate schema and reject invalid schemas', async () => {
      const invalidSchema = { invalid: 'schema' };
      const schemaBuffer = Buffer.from(JSON.stringify(invalidSchema, null, 2));

      const response = await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .attach('spec', schemaBuffer, 'openapi.json')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Schema validation failed');
    });

    it('should reject upload without application name', async () => {
      const schemaBuffer = Buffer.from(JSON.stringify(sampleOpenApiSchema, null, 2));

      const response = await request(app)
        .post('/api/schemas/upload')
        .attach('spec', schemaBuffer, 'openapi.json')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Application name is required');
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Schema file is required');
    });
  });

  describe('GET /api/schemas/latest/:application/:service?', () => {
    beforeEach(async () => {

      const schemaBuffer = Buffer.from(JSON.stringify(sampleOpenApiSchema, null, 2));

      await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .attach('spec', schemaBuffer, 'openapi.json');
    });

    it('should get latest schema for application', async () => {
      const response = await request(app)
        .get('/api/schemas/latest/test-app')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application).toBe('test-app');
      expect(response.body.data.version).toBe(1);
      expect(response.body.data.schema).toEqual(sampleOpenApiSchema);
    });

    it('should return 404 for non-existent application', async () => {
      const response = await request(app)
        .get('/api/schemas/latest/non-existent-app')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Schema not found');
    });
  });

  describe('GET /api/schemas/versions/:application/:service?', () => {
    beforeEach(async () => {

      const schemaBuffer = Buffer.from(JSON.stringify(sampleOpenApiSchema, null, 2));

      await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .attach('spec', schemaBuffer, 'openapi.json');

      const modifiedSchema = {
        ...sampleOpenApiSchema,
        info: { ...sampleOpenApiSchema.info, version: '2.0.0' }
      };
      const modifiedBuffer = Buffer.from(JSON.stringify(modifiedSchema, null, 2));

      await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .attach('spec', modifiedBuffer, 'openapi.json');
    });

    it('should list all versions for application', async () => {
      const response = await request(app)
        .get('/api/schemas/versions/test-app')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalVersions).toBe(2);
      expect(response.body.data.versions).toHaveLength(2);

      expect(response.body.data.versions[0].version).toBe(2);
      expect(response.body.data.versions[1].version).toBe(1);

      expect(response.body.data.versions[0].isLatest).toBe(true);
      expect(response.body.data.versions[1].isLatest).toBe(false);
    });
  });

  describe('GET /api/applications', () => {
    beforeEach(async () => {
      const schemaBuffer = Buffer.from(JSON.stringify(sampleOpenApiSchema, null, 2));

      await request(app)
        .post('/api/schemas/upload')
        .field('application', 'app1')
        .attach('spec', schemaBuffer, 'openapi.json');

      await request(app)
        .post('/api/schemas/upload')
        .field('application', 'app2')
        .attach('spec', schemaBuffer, 'openapi.json');
    });

    it('should list all applications', async () => {
      const response = await request(app)
        .get('/api/applications')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      const appNames = response.body.data.map(app => app.name);
      expect(appNames).toContain('app1');
      expect(appNames).toContain('app2');
    });
  });

  describe('GET /api/stats', () => {
    beforeEach(async () => {
      const schemaBuffer = Buffer.from(JSON.stringify(sampleOpenApiSchema, null, 2));

      await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .field('service', 'service1')
        .attach('spec', schemaBuffer, 'openapi.json');

      await request(app)
        .post('/api/schemas/upload')
        .field('application', 'test-app')
        .field('service', 'service2')
        .attach('spec', schemaBuffer, 'openapi.json');
    });

    it('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.database.applications).toBe(1);
      expect(response.body.data.database.services).toBe(2);
      expect(response.body.data.database.schemaVersions).toBe(2);
    });
  });
});