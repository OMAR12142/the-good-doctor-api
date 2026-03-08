const Patient = require('../models/Patient');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ─── Create Patient ────────────────────────────────────────────────────────────
exports.createPatient = catchAsync(async (req, res, next) => {
  const { name, phone, age, gender, medicalHistory } = req.body;

  const patient = await Patient.create({
    doctorId: req.user.id, // Multi-tenancy: inject from auth middleware
    name,
    phone,
    age,
    gender,
    medicalHistory,
  });

  res.status(201).json({
    status: 'success',
    data: { patient },
  });
});

// ─── Get All Patients (Paginated & Sortable) ───────────────────────────────────
exports.getAllPatients = catchAsync(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Sorting (default: newest first)
  const sortField = req.query.sort || '-createdAt';

  // Optional search by name
  const filter = { doctorId: req.user.id };
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const [patients, total] = await Promise.all([
    Patient.find(filter).sort(sortField).skip(skip).limit(limit),
    Patient.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: patients.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: { patients },
  });
});

// ─── Get Patient By ID ─────────────────────────────────────────────────────────
exports.getPatientById = catchAsync(async (req, res, next) => {
  const patient = await Patient.findOne({
    _id: req.params.id,
    doctorId: req.user.id, // Multi-tenancy: strict scoping
  });

  if (!patient) {
    return next(new AppError('No patient found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { patient },
  });
});

// ─── Update Patient ────────────────────────────────────────────────────────────
exports.updatePatient = catchAsync(async (req, res, next) => {
  // Only allow specific fields to be updated (whitelist)
  const allowedFields = ['name', 'phone', 'age', 'gender', 'medicalHistory'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const patient = await Patient.findOneAndUpdate(
    {
      _id: req.params.id,
      doctorId: req.user.id, // Multi-tenancy: strict scoping
    },
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!patient) {
    return next(new AppError('No patient found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { patient },
  });
});

// ─── Delete Patient ────────────────────────────────────────────────────────────
exports.deletePatient = catchAsync(async (req, res, next) => {
  const patient = await Patient.findOneAndDelete({
    _id: req.params.id,
    doctorId: req.user.id, // Multi-tenancy: strict scoping
  });

  if (!patient) {
    return next(new AppError('No patient found with that ID.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
