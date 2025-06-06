'use strict';

// Helper function to register and login a user to get a token
export const getAuthToken = async (server) => {
  // Register a new user
  await server.inject({
    method: 'POST',
    url: '/api/v1/users/register',
    payload: {
      username: 'testUser1',
      email: 'testUser@example.com',
      password: 'password123',
    },
  });

  // Login to get the token
  const res = await server.inject({
    method: 'POST',
    url: '/api/v1/users/login',
    payload: {
      email: 'testUser@example.com',
      password: 'password123',
    },
  });

  return res.result.data.token;
};

// Helper to make authenticated requests
export const makeAuthenticatedRequest = async (server, token, options) => {
  return server.inject({
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
};

// Helper to generate random test data
export const generateTestData = {
  user: (overrides = {}) => ({
    username: `user_${Math.random().toString(36).substr(2, 9)}`,
    email: `test_${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: 'TestPassword123!',
    ...overrides,
  }),

  credentials: (overrides = {}) => ({
    username: `user_${Math.random().toString(36).substr(2, 9)}`,
    password: 'TestPassword123!',
    ...overrides,
  }),
};

// Helper to clean up test data (if needed)
export const cleanupTestData = async () => {
  // Implement database cleanup if needed
  // This depends on your database setup
  console.log('Cleaning up test data...');
};
