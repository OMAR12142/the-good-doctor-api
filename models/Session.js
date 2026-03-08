const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      default: Date.now,
    },
    treatmentDetails: {
      type: String,
      trim: true,
      maxlength: [2000, 'Treatment details cannot exceed 2000 characters'],
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: [0, 'Total cost cannot be negative'],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    myCommission: {
      type: Number,
      required: [true, 'My commission is required'],
      min: [0, 'My commission cannot be negative'],
    },
    nextAppointmentDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Remaining Balance ────────────────────────────────────────────────
// Calculated dynamically — never stored in the database.
// remainingBalance = totalCost - amountPaid
sessionSchema.virtual('remainingBalance').get(function () {
  return this.totalCost - this.amountPaid;
});

// ─── Indexes ───────────────────────────────────────────────────────────────────
// Multi-tenancy compound index: all session queries scoped by doctor + patient
sessionSchema.index({ doctorId: 1, patientId: 1 });

// Index for fetching sessions sorted by date within a doctor's scope
sessionSchema.index({ doctorId: 1, date: -1 });

// Index for upcoming appointments lookup
sessionSchema.index({ doctorId: 1, nextAppointmentDate: 1 });

// ─── Pre-save Validation: amountPaid <= totalCost ──────────────────────────────
sessionSchema.pre('save', function (next) {
  if (this.amountPaid > this.totalCost) {
    const err = new Error('Amount paid cannot exceed the total cost');
    err.statusCode = 400;
    return next(err);
  }
  next();
});

// ─── Remove __v from JSON ──────────────────────────────────────────────────────
sessionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
