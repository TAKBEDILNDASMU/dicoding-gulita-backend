'use strict';
import Joi from 'joi';

/**
 * Validation schema for user registration payload
 * Validates username, email, and password with comprehensive error messages
 */
export const registerPayloadSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.base': '"username" must be a string',
    'string.empty': '"username" cannot be empty',
    'string.alphanum': '"username" must only contain alphanumeric characters',
    'string.min': '"username" must be at least {#limit} characters long',
    'string.max': '"username" must not exceed {#limit} characters',
    'any.required': '"username" is required',
  }),

  email: Joi.string()
    .email({
      tlds: { allow: false }, // Allow all TLDs for flexibility
      minDomainSegments: 2,
    })
    .max(254) // RFC 5321 email length limit
    .required()
    .messages({
      'string.base': '"email" must be a string',
      'string.empty': '"email" cannot be empty',
      'string.email': '"email" must be a valid email address',
      'string.max': '"email" must not exceed {#limit} characters',
      'any.required': '"email" is required',
    }),

  password: Joi.string().min(8).max(128).required().messages({
    'string.base': '"password" must be a string',
    'string.empty': '"password" cannot be empty',
    'string.min': '"password" must be at least {#limit} characters long',
    'string.max': '"password" must not exceed {#limit} characters',
  }),
}).options({
  abortEarly: false, // Return all validation errors, not just the first one
  stripUnknown: true, // Remove unknown properties
});

/**
 * Validation schema for user login payload
 * Validates email and password for authentication
 */
export const loginPayloadSchema = Joi.object({
  email: Joi.string()
    .email({
      tlds: { allow: false },
      minDomainSegments: 2,
    })
    .max(254)
    .required()
    .messages({
      'string.base': '"email" must be a string',
      'string.empty': '"email" cannot be empty',
      'string.email': '"email" must be a valid email address',
      'string.max': '"email" must not exceed {#limit} characters',
      'any.required': '"email" is required',
    }),

  password: Joi.string().min(1).max(128).required().messages({
    'string.base': '"password" must be a string',
    'string.empty': '"password" cannot be empty',
    'string.min': '"password" is required',
    'string.max': '"password" must not exceed {#limit} characters',
    'any.required': '"password" is required',
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/**
 * Validation schema for password update payload
 * Validates current password and new password
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required().messages({
    'string.base': '"currentPassword" must be a string',
    'string.empty': '"currentPassword" cannot be empty',
    'string.min': '"currentPassword" is required',
    'string.max': '"currentPassword" must not exceed {#limit} characters',
    'any.required': '"currentPassword" is required',
  }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.base': '"newPassword" must be a string',
      'string.empty': '"newPassword" cannot be empty',
      'string.min': '"newPassword" must be at least {#limit} characters long',
      'string.max': '"newPassword" must not exceed {#limit} characters',
      'string.pattern.base':
        '"newPassword" must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)',
      'any.required': '"newPassword" is required',
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/**
 * Validation schema for profile update payload
 * Validates optional username and email updates
 */
export const updateProfileSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional().messages({
    'string.base': '"username" must be a string',
    'string.empty': '"username" cannot be empty',
    'string.alphanum': '"username" must only contain alphanumeric characters',
    'string.min': '"username" must be at least {#limit} characters long',
    'string.max': '"username" must not exceed {#limit} characters',
  }),

  email: Joi.string()
    .email({
      tlds: { allow: false },
      minDomainSegments: 2,
    })
    .max(254)
    .optional()
    .messages({
      'string.base': '"email" must be a string',
      'string.empty': '"email" cannot be empty',
      'string.email': '"email" must be a valid email address',
      'string.max': '"email" must not exceed {#limit} characters',
    }),
})
  .min(1)
  .options({
    abortEarly: false,
    stripUnknown: true,
  })
  .messages({
    'object.min': 'At least one field (username or email) must be provided for update',
  });

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

/**
 * Validation schema for user ID parameters
 * Validates numeric user ID in URL parameters
 */
export const userIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': '"id" must be a number',
    'number.integer': '"id" must be an integer',
    'number.positive': '"id" must be a positive number',
    'any.required': '"id" parameter is required',
  }),
}).options({
  stripUnknown: true,
});

/**
 * Validation schema for password reset request
 * Validates email for password reset
 */
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({
      tlds: { allow: false },
      minDomainSegments: 2,
    })
    .max(254)
    .required()
    .messages({
      'string.base': '"email" must be a string',
      'string.empty': '"email" cannot be empty',
      'string.email': '"email" must be a valid email address',
      'string.max': '"email" must not exceed {#limit} characters',
      'any.required': '"email" is required',
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/**
 * Validation schema for password reset confirmation
 * Validates reset token and new password
 */
export const resetPasswordSchema = Joi.object({
  token: Joi.string().min(32).max(256).required().messages({
    'string.base': '"token" must be a string',
    'string.empty': '"token" cannot be empty',
    'string.min': '"token" must be at least {#limit} characters long',
    'string.max': '"token" must not exceed {#limit} characters',
    'any.required': '"token" is required',
  }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.base': '"newPassword" must be a string',
      'string.empty': '"newPassword" cannot be empty',
      'string.min': '"newPassword" must be at least {#limit} characters long',
      'string.max': '"newPassword" must not exceed {#limit} characters',
      'string.pattern.base':
        '"newPassword" must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)',
      'any.required': '"newPassword" is required',
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/**
 * Validation schema for pagination query parameters
 * Validates page and limit parameters for paginated responses
 */
export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': '"page" must be a number',
    'number.integer': '"page" must be an integer',
    'number.min': '"page" must be at least {#limit}',
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': '"limit" must be a number',
    'number.integer': '"limit" must be an integer',
    'number.min': '"limit" must be at least {#limit}',
    'number.max': '"limit" must not exceed {#limit}',
  }),
}).options({
  stripUnknown: true,
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
  // Log the detailed error for server-side debugging
  console.error('Validation Error Details:', {
    path: request.path,
    method: request.method,
    payload: request.payload,
    query: request.query,
    params: request.params,
    headers: request.headers,
    errors: err.details,
  });

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
