const Session = require('../models/Session');
const Patient = require('../models/Patient');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ─── Create Session ────────────────────────────────────────────────────────────
exports.createSession = catchAsync(async (req, res, next) => {
  const { patientId, date, treatmentDetails, totalCost, amountPaid, myCommission, nextAppointmentDate } =
    req.body;

  // Verify the patient belongs to this doctor before creating a session
  const patient = await Patient.findOne({
    _id: patientId,
    doctorId: req.user.id,
  });

  if (!patient) {
    return next(
      new AppError('No patient found with that ID for your account.', 404)
    );
  }

  const session = await Session.create({
    doctorId: req.user.id, // Multi-tenancy: inject from auth middleware
    patientId,
    date,
    treatmentDetails,
    totalCost,
    amountPaid,
    myCommission,
    nextAppointmentDate,
  });

  res.status(201).json({
    status: 'success',
    data: {
      session: {
        ...session.toJSON(),
        remainingBalance: session.remainingBalance, // Include virtual
      },
    },
  });
});

// ─── Get Patient Sessions (Treatment History) ──────────────────────────────────
exports.getPatientSessions = catchAsync(async (req, res, next) => {
  const { patientId } = req.params;

  // Verify the patient belongs to this doctor
  const patient = await Patient.findOne({
    _id: patientId,
    doctorId: req.user.id,
  });

  if (!patient) {
    return next(
      new AppError('No patient found with that ID for your account.', 404)
    );
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {
    doctorId: req.user.id, // Multi-tenancy: strict scoping
    patientId,
  };

  const [sessions, total] = await Promise.all([
    Session.find(filter).sort('-date').skip(skip).limit(limit),
    Session.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: sessions.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: { sessions },
  });
});

// ─── Update Session ────────────────────────────────────────────────────────────
exports.updateSession = catchAsync(async (req, res, next) => {
  // Whitelist allowed update fields
  const allowedFields = [
    'treatmentDetails',
    'totalCost',
    'amountPaid',
    'myCommission',
    'nextAppointmentDate',
    'date',
  ];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const session = await Session.findOneAndUpdate(
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

  if (!session) {
    return next(new AppError('No session found with that ID.', 404));
  }

  // Validate amountPaid <= totalCost after update
  if (session.amountPaid > session.totalCost) {
    // Revert the update
    await Session.findOneAndUpdate(
      { _id: session._id, doctorId: req.user.id },
      { amountPaid: session.totalCost },
      { new: true }
    );
    return next(
      new AppError('Amount paid cannot exceed the total cost.', 400)
    );
  }

  res.status(200).json({
    status: 'success',
    data: { session },
  });
});
