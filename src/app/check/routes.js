import { checkHandler } from './diContainer.js';
import { authorizationHeaderSchema, checkIdParamSchema, createCheckPayloadSchema, validationFailAction } from './validation.js';

/**
 * Get user health check history route
 * Returns a list of all health checks for the current user
 */
const getCheckHistoryRoute = {
  method: 'GET',
  path: '/api/v1/users/checks',
  options: {
    description: 'Get user health check history',
    notes: 'Returns a list of all health check results for the authenticated user',
    tags: ['api', 'users', 'checks', 'history'],
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
  handler: checkHandler.getCheckHistory,
};

/**
 * Create new health check entry for a user
 */
const createCheckHistoryRoute = {
  method: 'POST',
  path: '/api/v1/users/checks',
  options: {
    description: 'Create a new health check entry',
    notes: 'Adds a new health check record for the authenticated user',
    tags: ['api', 'users', 'checks'],
    validate: {
      headers: authorizationHeaderSchema,
      payload: createCheckPayloadSchema,
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
  handler: checkHandler.createCheckHistory,
};

/**
 * Create new public health check entry (No Authentication)
 * This route is for public data submission, e.g., for ML model training.
 */
const createPublicCheckRoute = {
  method: 'POST',
  path: '/api/v1/checks', // Note the new, more generic path
  options: {
    description: 'Create a new public health check entry',
    notes: 'Adds a new health check record anonymously. This data may be used for analysis with services like Hugging Face.',
    tags: ['api', 'checks', 'public'],
    validate: {
      // No 'authorization' header validation is needed for a public route
      payload: createCheckPayloadSchema,
      failAction: validationFailAction,
    },
    response: {
      failAction: 'ignore',
    },
    auth: false, // This is the key change to make the route public
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  // You will need to create this new handler function in your checkHandler
  handler: checkHandler.createPublicCheck,
};

/**
 * Delete a specific health check entry
 */
const deleteCheckHistoryRoute = {
  method: 'DELETE',
  path: '/api/v1/users/checks/{id}',
  options: {
    description: 'Delete a specific health check entry',
    notes: 'Deletes a health check record by its ID for the authenticated user',
    tags: ['api', 'users', 'checks'],
    validate: {
      headers: authorizationHeaderSchema,
      params: checkIdParamSchema,
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
  handler: checkHandler.deleteCheckHistory,
};

/**
 * Array of all authentication routes
 * Export all routes for registration with Hapi server
 */
const routes = [getCheckHistoryRoute, createCheckHistoryRoute, deleteCheckHistoryRoute, createPublicCheckRoute];

export default routes;
