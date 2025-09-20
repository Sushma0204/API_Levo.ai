import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileStore {
  constructor() {
    this.baseDir = path.join(__dirname, '../storage/schemas');
    this.ensureStorageDirectory();
  }

  async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  generateFilePath(application, service, version, schemaType) {
    const sanitizedApp = this.sanitizeFileName(application);
    const sanitizedService = service ? this.sanitizeFileName(service) : null;
    
    let dirPath;
    if (service) {
      dirPath = path.join(this.baseDir, sanitizedApp, sanitizedService);
    } else {
      dirPath = path.join(this.baseDir, sanitizedApp);
    }

    const fileName = `schema_v${version}.${schemaType}`;
    return path.join(dirPath, fileName);
  }

  async saveSchema(filePath, schemaContent, schemaType) {
    try {
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });

      let contentToWrite;
      if (schemaType === 'json') {
        contentToWrite = JSON.stringify(schemaContent, null, 2);
      } else {
        contentToWrite = JSON.stringify(schemaContent, null, 2);
      }

      await fs.writeFile(filePath, contentToWrite, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save schema file: ${error.message}`);
    }
  }

  async readSchema(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read schema file: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteSchema(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw new Error(`Failed to delete schema file: ${error.message}`);
    }
  }

  async listSchemaFiles(application, service) {
    try {
      const sanitizedApp = this.sanitizeFileName(application);
      const sanitizedService = service ? this.sanitizeFileName(service) : null;
      
      let dirPath;
      if (service) {
        dirPath = path.join(this.baseDir, sanitizedApp, sanitizedService);
      } else {
        dirPath = path.join(this.baseDir, sanitizedApp);
      }

      const files = await fs.readdir(dirPath);
      return files.filter(file => file.startsWith('schema_v'));
    } catch (error) {
      return [];
    }
  }

  sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  async getStorageStats() {
    try {
      const stats = {
        totalApplications: 0,
        totalServices: 0,
        totalSchemas: 0
      };

      const apps = await fs.readdir(this.baseDir);
      stats.totalApplications = apps.length;

      for (const app of apps) {
        const appPath = path.join(this.baseDir, app);
        const appStat = await fs.stat(appPath);
        
        if (appStat.isDirectory()) {
          const items = await fs.readdir(appPath);
          
          for (const item of items) {
            const itemPath = path.join(appPath, item);
            const itemStat = await fs.stat(itemPath);
            
            if (itemStat.isDirectory()) {
              stats.totalServices++;
              const schemas = await fs.readdir(itemPath);
              stats.totalSchemas += schemas.filter(file => file.startsWith('schema_v')).length;
            } else if (item.startsWith('schema_v')) {
              stats.totalSchemas++;
            }
          }
        }
      }

      return stats;
    } catch (error) {
      return {
        totalApplications: 0,
        totalServices: 0,
        totalSchemas: 0,
        error: error.message
      };
    }
  }
}

export default new FileStore();