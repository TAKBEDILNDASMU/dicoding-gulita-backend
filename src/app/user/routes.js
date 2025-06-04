import { authHandler } from './diContainer.js';
import { authorizationHeaderSchema, updateProfileSchema, changePasswordSchema, validationFailAction } from './validation.js';

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
 * Change password route
 * Allows authenticated users to change their password
 */
const changePasswordRoute = {
  method: 'PUT',
  path: '/api/v1/users/change-password',
  options: {
    description: 'Change user password',
    notes: 'Allows authenticated users to change their password',
    tags: ['api', 'auth', 'users', 'password'],
    validate: {
      headers: authorizationHeaderSchema,
      payload: changePasswordSchema,
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
  handler: authHandler.changePassword,
};

/**
 * Array of all authentication routes
 * Export all routes for registration with Hapi server
 */
const routes = [getProfileRoute, updateProfileRoute, changePasswordRoute];

export default routes;
