import express from 'express';
import multer from 'multer';
import { SchemaController } from '../controllers/index.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.json', '.yaml', '.yml'];
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    
    if (allowedTypes.includes('.' + fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON and YAML files are allowed'), false);
    }
  }
});

// Schema routes
router.post('/schemas/upload', upload.single('spec'), SchemaController.uploadSchema);
router.get('/schemas/latest/:application', SchemaController.getLatestSchema);
router.get('/schemas/latest/:application/:service', SchemaController.getLatestSchema);
router.get('/schemas/version/:application/:version', SchemaController.getSchemaVersion);
router.get('/schemas/version/:application/:version/:service', SchemaController.getSchemaVersion);
router.get('/schemas/versions/:application', SchemaController.listSchemaVersions);
router.get('/schemas/versions/:application/:service', SchemaController.listSchemaVersions);

// Application and service routes
router.get('/applications', SchemaController.listApplications);
router.get('/applications/:application/services', SchemaController.listServices);

// Statistics route
router.get('/stats', SchemaController.getStats);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  if (error.message === 'Only JSON and YAML files are allowed') {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

export default router;
