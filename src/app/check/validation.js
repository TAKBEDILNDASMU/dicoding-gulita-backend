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
  bmi: Joi.number().precision(1).required().description('Body Mass Index'),
  age: Joi.number().integer().min(1).required().description('User age'),
  income: Joi.number().integer().min(0).required().description('User income'),
  phys_hlth: Joi.string().valid('low', 'medium', 'high').required().description('Physical health status'),
  education: Joi.string().valid('elementary', 'junior', 'senior', 'college').required().description('Education level'),
  gen_hlth: Joi.string().valid('low', 'medium', 'high').required().description('General health status'),
  ment_hlth: Joi.string().valid('low', 'medium', 'high').required().description('Mental health status'),
  diabetes_result: Joi.string().valid('non-diabetic', 'diabetic').required().description('Diabetes prediction result'),
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
