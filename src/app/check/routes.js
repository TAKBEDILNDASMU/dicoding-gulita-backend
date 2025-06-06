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
const routes = [getCheckHistoryRoute, createCheckHistoryRoute, deleteCheckHistoryRoute];

export default routes;
