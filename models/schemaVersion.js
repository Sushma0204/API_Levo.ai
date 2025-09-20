import mongoose from 'mongoose';

// Schema Version Schema
const schemaVersionSchema = new mongoose.Schema({
  application: {
    type: String,
    required: true,
    ref: 'Application'
  },
  service: {
    type: String,
    ref: 'Service',
    default: null
  },
  version: {
    type: Number,
    required: true,
    default: 1
  },
  schemaType: {
    type: String,
    enum: ['json', 'yaml'],
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  schemaContent: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isLatest: {
    type: Boolean,
    default: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    openApiVersion: String,
    title: String,
    version: String,
    servers: [String],
    pathsCount: Number,
    componentsCount: Number
  }
});

schemaVersionSchema.index({ application: 1, service: 1, version: -1 });
schemaVersionSchema.index({ application: 1, service: 1, isLatest: 1 });

const SchemaVersion = mongoose.model('SchemaVersion', schemaVersionSchema);

export default SchemaVersion;