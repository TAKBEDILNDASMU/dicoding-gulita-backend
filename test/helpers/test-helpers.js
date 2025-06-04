'use strict';

// Helper to create a test user
export const createTestUser = async (server, userData = {}) => {
  const defaultUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
  };

  const user = { ...defaultUser, ...userData };

  const res = await server.inject({
    method: 'POST',
    url: '/api/v1/users/register',
    payload: user,
  });

  return { user, response: res };
};

// Helper to login and get token
export const loginUser = async (server, credentials) => {
  const res = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: credentials,
  });

  return res;
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
