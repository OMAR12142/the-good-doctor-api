const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Generate a signed JWT for the given doctor ID.
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Helper: create token and send it in the response.
 */
const createSendToken = (doctor, statusCode, res) => {
  const token = signToken(doctor._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { doctor },
  });
};

// ─── Register ──────────────────────────────────────────────────────────────────
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, clinicName } = req.body;

  // Check if doctor already exists
  const existingDoctor = await Doctor.findOne({ email });
  if (existingDoctor) {
    return next(new AppError('A doctor with this email already exists.', 409));
  }

  const doctor = await Doctor.create({
    name,
    email,
    password,
    phone,
    clinicName,
  });

  createSendToken(doctor, 201, res);
});

// ─── Login ─────────────────────────────────────────────────────────────────────
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password are provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  // 2. Find doctor and explicitly select the password field
  const doctor = await Doctor.findOne({ email }).select('+password');

  if (!doctor || !(await doctor.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // 3. Send token
  createSendToken(doctor, 200, res);
});

// ─── Get Current Doctor Profile ────────────────────────────────────────────────
exports.getMe = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user.id);

  if (!doctor) {
    return next(new AppError('Doctor not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { doctor },
  });
});

// ─── Update Current Doctor Profile ─────────────────────────────────────────────
// Allows updating name, phone, and clinicName only.
// Email and password updates are NOT allowed in this route.
exports.updateMe = catchAsync(async (req, res, next) => {
  // Whitelist allowed fields
  const allowedFields = ['name', 'phone', 'clinicName'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Ensure at least one field is being updated
  if (Object.keys(updates).length === 0) {
    return next(new AppError('Please provide at least one field to update.', 400));
  }

  // Find and update the doctor
  const doctor = await Doctor.findByIdAndUpdate(
    req.user.id,
    updates,
    {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators
    }
  );

  if (!doctor) {
    return next(new AppError('Doctor not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { doctor },
  });
});