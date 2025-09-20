// utils/schemaValidator.js

import SwaggerParser from 'swagger-parser';
import yaml from 'js-yaml';

class SchemaValidator {
  static async validateSchema(fileBuffer, fileName) {
    try {
      const fileExtension = fileName.split('.').pop().toLowerCase();
      let parsedSchema;
      let schemaType;

      if (fileExtension === 'json') {
        parsedSchema = JSON.parse(fileBuffer.toString());
        schemaType = 'json';
      } else if (fileExtension === 'yaml' || fileExtension === 'yml') {
        parsedSchema = yaml.load(fileBuffer.toString());
        schemaType = 'yaml';
      } else {
        throw new Error('Unsupported file format. Only JSON and YAML files are supported.');
      }

      await SwaggerParser.validate(parsedSchema);

      const metadata = this.extractMetadata(parsedSchema);

      return {
        isValid: true,
        schema: parsedSchema,
        schemaType,
        metadata,
        message: 'Schema validation successful'
      };

    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        message: 'Schema validation failed'
      };
    }
  }

  static extractMetadata(schema) {
    const metadata = {
      openApiVersion: schema.openapi || schema.swagger || 'unknown',
      title: schema.info?.title || 'Untitled API',
      version: schema.info?.version || '1.0.0',
      servers: [],
      pathsCount: 0,
      componentsCount: 0
    };

    if (schema.servers && Array.isArray(schema.servers)) {
      metadata.servers = schema.servers.map(server => server.url);
    } else if (schema.host) {
      const protocol = schema.schemes && schema.schemes.length > 0 ? schema.schemes[0] : 'http';
      metadata.servers = [`${protocol}://${schema.host}${schema.basePath || ''}`];
    }

    if (schema.paths) {
      metadata.pathsCount = Object.keys(schema.paths).length;
    }

    if (schema.components && schema.components.schemas) {
      metadata.componentsCount = Object.keys(schema.components.schemas).length;
    } else if (schema.definitions) {
      metadata.componentsCount = Object.keys(schema.definitions).length;
    }

    return metadata;
  }

  static hasSchemaChanged(newSchema, existingSchema) {
    try {
      const newSchemaStr = JSON.stringify(newSchema, Object.keys(newSchema).sort());
      const existingSchemaStr = JSON.stringify(existingSchema, Object.keys(existingSchema).sort());
      
      return newSchemaStr !== existingSchemaStr;
    } catch (error) {
      return true;
    }
  }
}

export default SchemaValidator;