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
