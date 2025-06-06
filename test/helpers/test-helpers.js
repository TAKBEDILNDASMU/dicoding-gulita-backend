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

/**
 * Creates a new, unique user and returns their auth token and ID.
 * This is useful for tests that need to associate data with a specific user.
 * @param {Object} server - The Hapi server instance
 * @returns {Promise<{userId: string, authToken: string}>}
 */
export const createAuthenticatedUserAndGetToken = async (server) => {
  // Use a unique identifier to prevent collisions between test runs
  const uniqueId = Date.now() + Math.random().toString(36).substring(2, 7);
  const testUserData = {
    username: `testUser${uniqueId}`,
    email: `testUser${uniqueId}@example.com`,
    password: 'securepassword123',
  };

  const registerRes = await server.inject({
    method: 'POST',
    url: '/api/v1/users/register',
    payload: testUserData,
  });

  const { id: userId } = JSON.parse(registerRes.payload).data.user;

  const loginRes = await server.inject({
    method: 'POST',
    url: '/api/v1/users/login',
    payload: {
      email: testUserData.email,
      password: testUserData.password,
    },
  });

  const { token: authToken } = JSON.parse(loginRes.payload).data;

  return { userId, authToken };
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
