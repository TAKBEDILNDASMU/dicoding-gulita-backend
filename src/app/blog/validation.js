'use strict';
import Joi from 'joi';

/**
 * Validation schema for creating a new blog post
 * Validates all required and optional fields for blog creation
 */
export const createBlogPayloadSchema = Joi.object({
  title: Joi.string().min(3).max(255).required().messages({
    'string.base': '"title" must be a string',
    'string.empty': '"title" cannot be empty',
    'string.min': '"title" must be at least {#limit} characters long',
    'string.max': '"title" must not exceed {#limit} characters',
    'any.required': '"title" is required',
  }),
  content: Joi.string().min(10).required().messages({
    'string.base': '"content" must be a string',
    'string.empty': '"content" cannot be empty',
    'string.min': '"content" must be at least {#limit} characters long',
    'any.required': '"content" is required',
  }),
  excerpt: Joi.string().max(500).optional().messages({
    'string.base': '"excerpt" must be a string',
    'string.max': '"excerpt" must not exceed {#limit} characters',
  }),
  category: Joi.string().valid('diabetes', 'nutrition', 'lifestyle', 'exercise', 'mental-health').required().messages({
    'string.base': '"category" must be a string',
    'any.only': '"category" must be one of: diabetes, nutrition, lifestyle, exercise, mental-health',
    'any.required': '"category" is required',
  }),
  tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional().messages({
    'array.base': '"tags" must be an array',
    'array.max': '"tags" must not exceed {#limit} items',
    'string.min': 'Each tag must be at least {#limit} character long',
    'string.max': 'Each tag must not exceed {#limit} characters',
  }),
  author: Joi.string().min(1).max(255).required().messages({
    'string.base': '"author" must be a string',
    'string.empty': '"author" cannot be empty',
    'string.max': '"author" must not exceed {#limit} characters',
    'any.required': '"author" is required',
  }),
  featured_image_url: Joi.string().uri().optional().messages({
    'string.base': '"featured_image_url" must be a string',
    'string.uri': '"featured_image_url" must be a valid URL',
  }),
  status: Joi.string().valid('draft', 'published', 'archived').default('published').messages({
    'string.base': '"status" must be a string',
    'any.only': '"status" must be one of: draft, published, archived',
  }),
  reading_time_minutes: Joi.number().integer().min(1).max(999).optional().messages({
    'number.base': '"reading_time_minutes" must be a number',
    'number.integer': '"reading_time_minutes" must be an integer',
    'number.min': '"reading_time_minutes" must be at least {#limit}',
    'number.max': '"reading_time_minutes" must not exceed {#limit}',
  }),
  published_at: Joi.date().iso().optional().messages({
    'date.base': '"published_at" must be a valid date',
    'date.format': '"published_at" must be in ISO format',
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/**
 * Validation schema for updating an existing blog post.
 * All fields are optional to allow for partial updates.
 * Includes custom messages for consistency.
 */
export const updateBlogPayloadSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional().messages({
    'string.base': '"title" must be a string',
    'string.min': '"title" must be at least {#limit} characters long',
    'string.max': '"title" must not exceed {#limit} characters',
  }),
  content: Joi.string().min(10).optional().messages({
    'string.base': '"content" must be a string',
    'string.min': '"content" must be at least {#limit} characters long',
  }),
  excerpt: Joi.string().max(500).optional().messages({
    'string.base': '"excerpt" must be a string',
    'string.max': '"excerpt" must not exceed {#limit} characters',
  }),
  category: Joi.string().valid('diabetes', 'nutrition', 'lifestyle', 'exercise', 'mental-health').optional().messages({
    'string.base': '"category" must be a string',
    'any.only': '"category" must be one of: diabetes, nutrition, lifestyle, exercise, mental-health',
  }),
  tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional().messages({
    'array.base': '"tags" must be an array',
    'array.max': '"tags" must not exceed {#limit} items',
    'string.min': 'Each tag must be at least {#limit} character long',
    'string.max': 'Each tag must not exceed {#limit} characters',
  }),
  author: Joi.string().min(1).max(255).optional().messages({
    'string.base': '"author" must be a string',
    'string.max': '"author" must not exceed {#limit} characters',
    'string.min': '"author" must be at least {#limit} character long',
  }),
  featured_image_url: Joi.string().uri().optional().messages({
    'string.base': '"featured_image_url" must be a string',
    'string.uri': '"featured_image_url" must be a valid URL',
  }),
  status: Joi.string().valid('draft', 'published', 'archived').optional().messages({
    'string.base': '"status" must be a string',
    'any.only': '"status" must be one of: draft, published, archived',
  }),
  reading_time_minutes: Joi.number().integer().min(1).max(999).optional().messages({
    'number.base': '"reading_time_minutes" must be a number',
    'number.integer': '"reading_time_minutes" must be an integer',
    'number.min': '"reading_time_minutes" must be at least {#limit}',
    'number.max': '"reading_time_minutes" must not exceed {#limit}',
  }),
  published_at: Joi.date().iso().optional().messages({
    'date.base': '"published_at" must be a valid date',
    'date.format': '"published_at" must be in ISO format',
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export const getListBlogQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Page number for pagination'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Number of items per page'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').description('Sort order (ascending or descending)'),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/**
 * Validation schema for blog ID path parameter.
 */
export const blogIdParamSchema = Joi.object({
  id: Joi.string().required().description('The ID of the blog post').messages({
    'string.base': '"id" must be a string',
    'string.empty': '"id" cannot be empty',
    'any.required': '"id" is required',
  }),
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
