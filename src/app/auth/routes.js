'use strict';
import { authHandler } from './diContainer.js';
import { registerPayloadSchema, loginPayloadSchema, validationFailAction, authorizationHeaderSchema, updateProfileSchema } from './validation.js';
import Joi from 'joi';

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
 * Get user profile route
 * Returns current user's profile information
 */
const getProfileRoute = {
  method: 'GET',
  path: '/api/v1/users/profile',
  options: {
    description: 'Get current user profile',
    notes: "Returns the authenticated user's profile information",
    tags: ['api', 'auth', 'users', 'profile'],
    validate: {
      headers: authorizationHeaderSchema,
      failAction: validationFailAction,
    },
    response: {
      failAction: 'ignore',
    },
    auth: 'jwt',
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with', 'authorization'],
    },
  },
  handler: authHandler.getProfile,
};

/**
 * Update user profile route
 * Update user's profile information (username, email)
 */
const updateProfileRoute = {
  method: 'PUT',
  path: '/api/v1/users/profile',
  options: {
    description: 'Update user profile',
    notes: "Updates the authenticated user's profile information",
    tags: ['api', 'auth', 'users', 'profile'],
    validate: {
      headers: authorizationHeaderSchema,
      payload: updateProfileSchema,
      failAction: validationFailAction,
    },
    response: {
      failAction: 'ignore',
    },
    auth: 'jwt',
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with', 'authorization'],
    },
  },
  handler: authHandler.updateProfile,
};

/**
 * Array of all authentication routes
 * Export all routes for registration with Hapi server
 */
const routes = [registerRoute, loginRoute, getProfileRoute, updateProfileRoute];

export default routes;
