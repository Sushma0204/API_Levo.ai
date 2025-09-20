import { Application, Service, SchemaVersion } from '../models/index.js';
import { SchemaValidator, FileStore } from '../utils/index.js';

class SchemaController {
  static async uploadSchema(req, res) {
    try {
      const { application, service } = req.body;
      
      if (!application) {
        return res.status(400).json({
          success: false,
          error: 'Application name is required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Schema file is required'
        });
      }

      // Validate schema
      const validation = await SchemaValidator.validateSchema(
        req.file.buffer, 
        req.file.originalname
      );

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Schema validation failed',
          details: validation.error
        });
      }

      // Create or get application
      let app = await Application.findOne({ name: application });
      if (!app) {
        app = new Application({ name: application });
        await app.save();
      }

      // Create or get service if provided
      let serviceDoc = null;
      if (service) {
        serviceDoc = await Service.findOne({ name: service, application: application });
        if (!serviceDoc) {
          serviceDoc = new Service({ 
            name: service, 
            application: application 
          });
          await serviceDoc.save();
        }
      }

      // if schema already exists and if it has changed
      const latestVersion = await SchemaVersion.findOne({
        application: application,
        service: service || null,
        isLatest: true
      });

      let newVersion = 1;

      if (latestVersion) {
        const hasChanged = SchemaValidator.hasSchemaChanged(
          validation.schema,
          latestVersion.schemaContent
        );

        if (!hasChanged) {
          return res.json({
            success: true,
            message: 'Schema unchanged, no new version created',
            data: {
              application: application,
              service: service,
              version: latestVersion.version,
              isNewVersion: false
            }
          });
        }

        newVersion = latestVersion.version + 1;
        
        latestVersion.isLatest = false;
        await latestVersion.save();
      }

      const filePath = FileStore.generateFilePath(
        application,
        service,
        newVersion,
        validation.schemaType
      );

      await FileStore.saveSchema(
        filePath,
        validation.schema,
        validation.schemaType
      );

      const schemaVersion = new SchemaVersion({
        application: application,
        service: service || null,
        version: newVersion,
        schemaType: validation.schemaType,
        originalFileName: req.file.originalname,
        filePath: filePath,
        schemaContent: validation.schema,
        metadata: validation.metadata,
        isLatest: true
      });

      await schemaVersion.save();

      res.status(201).json({
        success: true,
        message: 'Schema uploaded successfully',
        data: {
          application: application,
          service: service,
          version: newVersion,
          isNewVersion: true,
          metadata: validation.metadata
        }
      });

    } catch (error) {
      console.error('Schema upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  static async getLatestSchema(req, res) {
    try {
      const { application, service } = req.params;

      const query = {
        application: application,
        service: service || null,
        isLatest: true
      };

      const schemaVersion = await SchemaVersion.findOne(query);

      if (!schemaVersion) {
        return res.status(404).json({
          success: false,
          error: 'Schema not found'
        });
      }

      res.json({
        success: true,
        data: {
          application: schemaVersion.application,
          service: schemaVersion.service,
          version: schemaVersion.version,
          schemaType: schemaVersion.schemaType,
          originalFileName: schemaVersion.originalFileName,
          schema: schemaVersion.schemaContent,
          metadata: schemaVersion.metadata,
          uploadedAt: schemaVersion.uploadedAt
        }
      });

    } catch (error) {
      console.error('Get latest schema error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  static async getSchemaVersion(req, res) {
    try {
      const { application, version, service } = req.params;

      const query = {
        application: application,
        service: service || null,
        version: parseInt(version)
      };

      const schemaVersion = await SchemaVersion.findOne(query);

      if (!schemaVersion) {
        return res.status(404).json({
          success: false,
          error: 'Schema version not found'
        });
      }

      res.json({
        success: true,
        data: {
          application: schemaVersion.application,
          service: schemaVersion.service,
          version: schemaVersion.version,
          schemaType: schemaVersion.schemaType,
          originalFileName: schemaVersion.originalFileName,
          schema: schemaVersion.schemaContent,
          metadata: schemaVersion.metadata,
          uploadedAt: schemaVersion.uploadedAt
        }
      });

    } catch (error) {
      console.error('Get schema version error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  static async listSchemaVersions(req, res) {
    try {
      const { application, service } = req.params;

      const query = {
        application: application,
        service: service || null
      };

      const versions = await SchemaVersion.find(query)
        .select('-schemaContent')
        .sort({ version: -1 });

      res.json({
        success: true,
        data: {
          application: application,
          service: service,
          totalVersions: versions.length,
          versions: versions.map(v => ({
            version: v.version,
            schemaType: v.schemaType,
            originalFileName: v.originalFileName,
            isLatest: v.isLatest,
            metadata: v.metadata,
            uploadedAt: v.uploadedAt
          }))
        }
      });

    } catch (error) {
      console.error('List schema versions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  static async listApplications(req, res) {
    try {
      const applications = await Application.find()
        .select('name description createdAt updatedAt');

      res.json({
        success: true,
        data: applications
      });

    } catch (error) {
      console.error('List applications error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  static async listServices(req, res) {
    try {
      const { application } = req.params;

      const services = await Service.find({ application: application })
        .select('name description createdAt updatedAt');

      res.json({
        success: true,
        data: {
          application: application,
          services: services
        }
      });

    } catch (error) {
      console.error('List services error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  static async getStats(req, res) {
    try {
      const [appCount, serviceCount, schemaCount, storageStats] = await Promise.all([
        Application.countDocuments(),
        Service.countDocuments(),
        SchemaVersion.countDocuments(),
        FileStore.getStorageStats()
      ]);

      res.json({
        success: true,
        data: {
          database: {
            applications: appCount,
            services: serviceCount,
            schemaVersions: schemaCount
          },
          fileSystem: storageStats
        }
      });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}

export default SchemaController;