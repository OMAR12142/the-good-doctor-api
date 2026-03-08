const AppError = require('../utils/AppError');

/**
 * Joi validation middleware factory.
 *
 * Usage in routes:
 *   router.post('/patients', validate(createPatientSchema), controller.create);
 *
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against.
 * @returns {Function} Express middleware function.
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Report ALL errors, not just the first
      stripUnknown: true, // Remove fields not defined in the schema
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join('. ');
      return next(new AppError(messages, 400));
    }

    // Replace req.body with the validated & sanitized value
    req.body = value;
    next();
  };
};

module.exports = validate;
