'use strict';
import { authHandler } from './diContainer.js';
import { registerPayloadSchema, loginPayloadSchema, validationFailAction } from './validation.js';

/**
 * User registration route
 * Handles new user registration with comprehensive validation and error handling
 */
const registerRoute = {
  method: 'POST',
  path: '/api/v1/users/register',
  options: {
    description: 'Register a new user account',
    notes: 'Creates a new user account with username, email, and password',
    tags: ['api', 'auth', 'users'],
    validate: {
      payload: registerPayloadSchema,
      failAction: validationFailAction,
    },
    response: {
      failAction: 'ignore',
    },
    auth: false,
    cors: {
      origin: ['*'], // Configure based on your needs
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: authHandler.register,
};

/**
 * User login route
 * Handles user authentication and returns JWT token
 */
const loginRoute = {
  method: 'POST',
  path: '/api/v1/users/login',
  options: {
    description: 'Authenticate user and return access token',
    notes: 'Validates user credentials and returns JWT token for authenticated requests',
    tags: ['api', 'auth', 'users'],
    validate: {
      payload: loginPayloadSchema,
      failAction: validationFailAction,
    },
    response: {
      status: {
        200: {
          description: 'User successfully authenticated',
        },
        400: {
          description: 'Invalid input data or validation error',
        },
        401: {
          description: 'Invalid credentials',
        },
        404: {
          description: 'User not found',
        },
        500: {
          description: 'Internal server error',
        },
        503: {
          description: 'Service temporarily unavailable',
        },
      },
    },
    auth: false, // No authentication required for login
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: authHandler.login,
};

/**
 * Array of all authentication routes
 * Export all routes for registration with Hapi server
 */
const routes = [registerRoute, loginRoute];

export default routes;
