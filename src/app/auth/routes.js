'use strict';
import { authHandler } from './diContainer.js';
import { registerPayloadSchema, loginPayloadSchema, validationFailAction, logoutPayloadSchema, refreshTokenPayloadSchema } from './validation.js';

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
      failAction: 'ignore',
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
 * User logout route
 * Handles user logout and token invalidation
 */
const logoutRoute = {
  method: 'POST',
  path: '/api/v1/users/logout',
  options: {
    description: 'Logout user and invalidate access token',
    notes: 'Invalidates the current JWT token and logs out the authenticated user',
    tags: ['api', 'auth', 'users'],
    validate: {
      payload: logoutPayloadSchema,
      failAction: validationFailAction,
    },
    response: {
      failAction: 'ignore',
    },
    auth: {
      strategy: 'jwt',
    },
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: authHandler.logout,
};

const refreshTokenRoute = {
  method: 'POST',
  path: '/api/v1/users/token/refresh',
  options: {
    description: 'Refresh an access token using a refresh token',
    notes: 'Provides a new JWT access token if a valid refresh token is supplied',
    tags: ['api', 'auth', 'users'],
    validate: {
      // You'll need a schema for this payload
      payload: refreshTokenPayloadSchema,
      failAction: validationFailAction,
    },
    auth: false, // This route itself doesn't require an access token
  },
  handler: authHandler.refreshToken, // You'll need to create this new handler
};

/**
 * Array of all authentication routes
 * Export all routes for registration with Hapi server
 */
const routes = [registerRoute, loginRoute, logoutRoute, refreshTokenRoute];
export default routes;
