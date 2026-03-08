const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      immutable: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      immutable: true,
    },
    type: {
      type: String,
      required: [true, 'Media type is required'],
      enum: {
        values: ['photo', 'xray'],
        message: 'Media type must be either photo or xray',
      },
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
// Multi-tenancy compound index: all media queries are scoped by doctor + patient
mediaSchema.index({ doctorId: 1, patientId: 1 });

// Compound index for filtering by type within a doctor + patient scope
mediaSchema.index({ doctorId: 1, patientId: 1, type: 1 });

// Index for fetching recent media (sorted by creation date)
mediaSchema.index({ doctorId: 1, createdAt: -1 });

// ─── Remove __v from JSON ──────────────────────────────────────────────────────
mediaSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
