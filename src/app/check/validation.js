import Joi from 'joi';

/**
 * Validation schema for JWT token in headers
 * Validates authorization header format
 */
export const authorizationHeaderSchema = Joi.object({
  authorization: Joi.string()
    .pattern(/^Bearer [A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/)
    .required()
    .messages({
      'string.base': '"authorization" must be a string',
      'string.empty': '"authorization" header cannot be empty',
      'string.pattern.base': '"authorization" header must be in format "Bearer <token>"',
      'any.required': '"authorization" header is required',
    }),
}).options({
  allowUnknown: true, // Allow other headers
});

// Validation schema for the health check payload
export const createCheckPayloadSchema = Joi.object({
  bmi: Joi.number().required().description('Body Mass Index (Float)'),
  age: Joi.number().integer().valid(3, 5, 7, 9).required().description('User age category'),
  income: Joi.number().integer().valid(1, 3, 5, 7, 8).required().description('User income category'),
  education: Joi.number().integer().valid(3, 4, 5, 6).required().description('Education level category'),
  gen_hlth: Joi.number().integer().valid(1, 2, 3, 4, 5).required().description('General health status category'),
  phys_hlth: Joi.number().integer().valid(0, 7, 15, 30).required().description('Physical health status category'),
  high_bp: Joi.number().integer().valid(0, 1).required().description('High Blood Pressure health status category'),
  diabetes_result: Joi.number().integer().valid(0, 1).optional().description('Diabetes prediction result'),
});
export const checkIdParamSchema = Joi.object({
  id: Joi.string().uuid().required().description('The ID of the check record to delete'),
});

/**
 * Custom validation function for handling Joi validation errors
 * Formats validation errors into a consistent response structure
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @param {Error} err - Joi validation error
 * @returns {Object} Formatted error response
 */
export const validationFailAction = (request, h, err) => {
  // Format validation errors for client response
  const errors = err.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value,
  }));

  return h
    .response({
      status: 'error',
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: errors,
    })
    .code(400)
    .header('Access-Control-Allow-Origin', '*')
    .takeover();
};

/**
 * Schema validation options for different validation contexts
 */
export const validationOptions = {
  // Strict validation - fails on first error, strips unknown properties
  strict: {
    abortEarly: true,
    stripUnknown: true,
    allowUnknown: false,
  },

  // Lenient validation - collects all errors, allows unknown properties
  lenient: {
    abortEarly: false,
    stripUnknown: false,
    allowUnknown: true,
  },

  // Default validation - collects all errors, strips unknown properties
  default: {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false,
  },
};
