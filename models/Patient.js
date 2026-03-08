const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      immutable: true, // Prevent reassigning a patient to another doctor
    },
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age value is unrealistic'],
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female'],
        message: 'Gender must be male, female',
      },
    },
    medicalHistory: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
// Primary multi-tenancy index: ensures all patient queries scoped by doctor are fast
patientSchema.index({ doctorId: 1 });

// Compound index for searching patients by name within a doctor's scope
patientSchema.index({ doctorId: 1, name: 1 });

// Compound index for phone lookup within a doctor's scope
patientSchema.index({ doctorId: 1, phone: 1 });

// ─── Remove __v from JSON ──────────────────────────────────────────────────────
patientSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
