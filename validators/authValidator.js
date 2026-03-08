const Joi = require('joi');

// ─── Register ──────────────────────────────────────────────────────────────────
exports.registerSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'string.empty': 'Name is required',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
  phone: Joi.string().trim().allow('').optional(),
  clinicName: Joi.string().trim().max(200).allow('').optional(),
});

// ─── Login ─────────────────────────────────────────────────────────────────────
exports.loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

// ─── Update Profile ───────────────────────────────────────────────────────────
// Allows updating name, phone, and clinicName only.
// Email and password updates are NOT allowed in this route.
exports.updateMeSchema = Joi.object({
  name: Joi.string().trim().max(100).optional().messages({
    'string.max': 'Name cannot exceed 100 characters',
  }),
  phone: Joi.string().trim().allow('').optional(),
  clinicName: Joi.string().trim().max(200).allow('').optional().messages({
    'string.max': 'Clinic name cannot exceed 200 characters',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});