import mongoose from 'mongoose';

// Service Schema
const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  application: {
    type: String,
    required: true,
    ref: 'Application'
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

serviceSchema.index({ name: 1, application: 1 }, { unique: true });

serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;