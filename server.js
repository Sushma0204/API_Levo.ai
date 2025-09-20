import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';
import helmet from 'helmet';
import compression from 'compression';
import router from './routes/index.js';
import clientRouter from "./routes/client.js";

const app = express();
const PORT = process.env.PORT || 3000; 

const MONGODB_MAIN = process.env.MONGODB_URI;
const MONGODB_TEST = process.env.MONGODB_URI_TEST;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', router);
app.use("/api/tests", clientRouter);

app.get('/', (req, res) => {
  res.json({
    message: 'Levo.ai Schema Upload and Versioning API',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/schemas/upload',
      latest: 'GET /api/schemas/latest/:application/:service?',
      version: 'GET /api/schemas/version/:application/:version/:service?',
      versions: 'GET /api/schemas/versions/:application/:service?',
      applications: 'GET /api/applications',
      services: 'GET /api/applications/:application/services',
      stats: 'GET /api/stats',
      health: 'GET /api/health'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

if (process.env.NODE_ENV !== 'test') {
  const MONGODB_URI = process.env.NODE_ENV === 'test' ? MONGODB_TEST : MONGODB_MAIN;

  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log(`Connected to MongoDB`);
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API Documentation: http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Database connection error:', error);
      process.exit(1);
    });

  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await mongoose.connection.close();
    process.exit(0);
  });
}

export default app;
