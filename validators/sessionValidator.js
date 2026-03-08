const Joi = require('joi');

// ─── Create Session ────────────────────────────────────────────────────────────
exports.createSessionSchema = Joi.object({
  patientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid patient ID format',
      'any.required': 'Patient ID is required',
    }),
  date: Joi.date().optional(),
  treatmentDetails: Joi.string().trim().max(2000).allow('').optional(),
  totalCost: Joi.number().min(0).required().messages({
    'number.min': 'Total cost cannot be negative',
    'any.required': 'Total cost is required',
  }),
  amountPaid: Joi.number().min(0).optional().default(0).messages({
    'number.min': 'Amount paid cannot be negative',
  }),
  myCommission: Joi.number().min(0).required().messages({
    'number.min': 'My commission cannot be negative',
    'any.required': 'My commission is required',
  }),
  nextAppointmentDate: Joi.date().allow(null).optional(),
});

// ─── Update Session ────────────────────────────────────────────────────────────
exports.updateSessionSchema = Joi.object({
  treatmentDetails: Joi.string().trim().max(2000).allow('').optional(),
  totalCost: Joi.number().min(0).optional(),
  amountPaid: Joi.number().min(0).optional(),
  myCommission: Joi.number().min(0).optional(),
  nextAppointmentDate: Joi.date().allow(null).optional(),
  date: Joi.date().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});
