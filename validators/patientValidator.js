const Joi = require('joi');

// ─── Create Patient ────────────────────────────────────────────────────────────
exports.createPatientSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'string.empty': 'Patient name is required',
    'any.required': 'Patient name is required',
  }),
  phone: Joi.string().trim().allow('').optional(),
  age: Joi.number().integer().min(0).max(150).optional().messages({
    'number.min': 'Age cannot be negative',
    'number.max': 'Age value is unrealistic',
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional().messages({
    'any.only': 'Gender must be male, female, or other',
  }),
  medicalHistory: Joi.array().items(Joi.string().trim()).optional(),
});

// ─── Update Patient ────────────────────────────────────────────────────────────
exports.updatePatientSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  phone: Joi.string().trim().allow('').optional(),
  age: Joi.number().integer().min(0).max(150).optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  medicalHistory: Joi.array().items(Joi.string().trim()).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});
