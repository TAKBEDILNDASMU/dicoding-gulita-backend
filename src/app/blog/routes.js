'use strict';
import { blogHandler } from './diContainer.js';
import { blogIdParamSchema, createBlogPayloadSchema, getListBlogQuerySchema, updateBlogPayloadSchema, validationFailAction } from './validation.js';

/**
 * Create blog route
 * Handles creating new blog posts
 */
const createBlogRoute = {
  method: 'POST',
  path: '/api/v1/blogs',
  options: {
    description: 'Create a new blog post',
    notes: 'Creates a new blog post with title, content, and metadata',
    tags: ['api', 'blogs'],
    validate: {
      payload: createBlogPayloadSchema,
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
  handler: blogHandler.createBlog,
};

/**
 * Get blog route
 * Handles retrieving a specific blog post by ID
 */
const getBlogRoute = {
  method: 'GET',
  path: '/api/v1/blogs/{id}',
  options: {
    description: 'Get a blog post by ID',
    notes: 'Retrieves a specific blog post using its unique identifier',
    tags: ['api', 'blogs'],
    validate: {
      failAction: validationFailAction,
    },
    response: {
      failAction: 'ignore',
    },
    auth: false, // Allow unauthenticated access
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: blogHandler.getBlog,
};

/**
 * Update blog route
 * Handles updating an existing blog post by ID
 */
const updateBlogRoute = {
  method: 'PUT', // Or 'PATCH' if you prefer partial updates
  path: '/api/v1/blogs/{id}',
  options: {
    description: 'Update an existing blog post',
    notes: 'Updates an existing blog post identified by its ID with new title, content, or metadata',
    tags: ['api', 'blogs'],
    validate: {
      payload: updateBlogPayloadSchema,
      params: blogIdParamSchema,
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
  handler: blogHandler.updateBlog,
};

/**
 * Delete blog route
 * Handles deleting an existing blog post by ID
 */
const deleteBlogRoute = {
  method: 'DELETE',
  path: '/api/v1/blogs/{id}',
  options: {
    description: 'Delete a blog post by ID',
    notes: 'Deletes an existing blog post using its unique identifier. This action is irreversible.',
    tags: ['api', 'blogs'],
    validate: {
      params: blogIdParamSchema,
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
  handler: blogHandler.deleteBlog,
};

/**
 * Get List of Blogs Route
 * Handles retrieving a paginated list of blog posts with filtering and sorting
 */
const getListBlogRoute = {
  method: 'GET',
  path: '/api/v1/blogs',
  options: {
    description: 'Get a list of blog posts',
    notes: 'Retrieves a paginated list of blog posts. Supports filtering by category, status, and tags, as well as sorting.',
    tags: ['api', 'blogs'],
    validate: {
      query: getListBlogQuerySchema,
      failAction: validationFailAction,
    },
    response: {
      failAction: 'ignore',
    },
    auth: false, // Allow unauthenticated access
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: blogHandler.getListBlog, // Points to the new handler method
};

/**
 * Array of all blog routes
 * Export all routes for registration with Hapi server
 */
const routes = [createBlogRoute, getBlogRoute, updateBlogRoute, deleteBlogRoute, getListBlogRoute];
export default routes;
