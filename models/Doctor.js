const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries by default
    },
    phone: {
      type: String,
      trim: true,
    },
    clinicName: {
      type: String,
      trim: true,
      maxlength: [200, 'Clinic name cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
// Unique index on email is automatically created by `unique: true` above.
// We add an explicit index on clinicName for potential future search queries.
doctorSchema.index({ clinicName: 1 });

// ─── Pre-save Hook: Hash Password ─────────────────────────────────────────────
doctorSchema.pre('save', async function (next) {
  // Only hash if the password field has been modified (or is new)
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method: Compare Password ─────────────────────────────────────────
doctorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Remove sensitive fields from JSON output ──────────────────────────────────
doctorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
