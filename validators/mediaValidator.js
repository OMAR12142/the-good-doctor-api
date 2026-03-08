const Joi = require('joi');

// ─── Upload Media ──────────────────────────────────────────────────────────────
// Note: The file itself is handled by Multer middleware, not Joi.
// This validates only the text fields sent alongside the file.
exports.uploadMediaSchema = Joi.object({
  patientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid patient ID format',
      'any.required': 'Patient ID is required',
    }),
  type: Joi.string().valid('photo', 'xray').required().messages({
    'any.only': 'Media type must be either "photo" or "xray"',
    'any.required': 'Media type is required',
  }),
  description: Joi.string().trim().max(500).allow('').optional(),
});
