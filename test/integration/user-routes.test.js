'use strict';
import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../../src/server.js';
import { clearTestData, createTestUserInDB } from '../helpers/db-helpers.js';
import { getAuthToken } from '../helpers/test-helpers.js';

export const lab = Lab.script();
const { before, after, describe, it } = lab;

describe('User Profile Route', () => {
  let server;
  let authToken;

  before(async () => {
    server = await init();
    // Clear previous test data to ensure a clean slate
    await clearTestData();
    // Get a valid token for the authenticated tests
    authToken = await getAuthToken(server);
  });

  after(async () => {
    await server.stop();
    await clearTestData();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return the user profile with a valid token', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/users/profile',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
      });

      expect(res.statusCode).to.equal(200);
      expect(res.result.data.password).to.not.exist();
    });

    it('should reject if no authorization token is provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/users/profile',
        // No headers provided
      });

      // Expecting 401 Unauthorized because auth is required
      expect(res.statusCode).to.equal(401);
    });

    it('should reject with an invalid or expired token', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/users/profile',
        headers: {
          Authorization: 'Bearer invalidtoken12345',
        },
      });

      // Expecting 401 Unauthorized due to invalid token
      expect(res.statusCode).to.equal(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should successfully update the user profile and verify the change', async () => {
      // Step 1: Update the user's profile
      const updateRes = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/profile',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: {
          username: 'testUpdateUsername',
          email: 'testUpdateEmail@example.com',
        },
      });

      expect(updateRes.statusCode).to.equal(200);
      expect(updateRes.result.message).to.equal('Profile updated successfully');

      // Step 2: Verify the profile was actually updated
      const verifyRes = await server.inject({
        method: 'GET',
        url: '/api/v1/users/profile',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
      });

      expect(verifyRes.statusCode).to.equal(200);
      expect(verifyRes.result.data.user.username).to.equal('testUpdateUsername');
      expect(verifyRes.result.data.user.email).to.equal('testUpdateEmail@example.com');
    });

    it('should reject update if no authorization token is provided', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/profile',
        payload: {
          username: 'noAuthUser',
        },
      });

      expect(res.statusCode).to.equal(401); // Unauthorized
    });

    it('should reject update for invalid payload data (e.g., invalid email)', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/profile',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: {
          email: 'not-an-email', // Invalid data
        },
      });

      expect(res.statusCode).to.equal(400); // Bad Request
    });

    it('should reject update if the new username is already taken', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/profile',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: {
          username: 'existingUser', // This username is already used by another user
        },
      });

      expect(res.statusCode).to.equal(409); // Conflict
    });

    it('should reject update if the new email is already taken', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/profile',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: {
          email: 'existing@example.com',
        },
      });

      expect(res.statusCode).to.equal(409); // Conflict
    });
  });

  describe('POST /api/v1/users/change-password', () => {
    const userEmail = 'testUpdateEmail@example.com';
    const oldPassword = 'password123';
    const newPassword = 'newPassword123';

    it('should successfully change the password and verify login with new password', async () => {
      // Step 1: Change the password
      const changeRes = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/change-password',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: {
          currentPassword: oldPassword,
          newPassword: newPassword,
        },
      });

      expect(changeRes.statusCode).to.equal(200);
      expect(changeRes.result.message).to.equal('Password changed successfully');

      // Step 2: Try to login with the OLD password (should fail)
      const loginOldPwRes = await server.inject({
        method: 'POST',
        url: '/api/v1/users/login',
        payload: {
          email: userEmail,
          password: oldPassword,
        },
      });

      expect(loginOldPwRes.statusCode).to.equal(401);

      // Step 3: Try to login with the NEW password (should succeed)
      const loginNewPwRes = await server.inject({
        method: 'POST',
        url: '/api/v1/users/login',
        payload: {
          email: userEmail,
          password: newPassword,
        },
      });
      expect(loginNewPwRes.statusCode).to.equal(200);
      expect(loginNewPwRes.result.data.token.accessToken).to.exist();
    });

    it('should reject if no authorization token is provided', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/change-password',
        payload: {
          currentPassword: oldPassword,
          newPassword: newPassword,
          confirmPassword: newPassword,
        },
      });

      expect(res.statusCode).to.equal(401); // Unauthorized
    });

    it('should reject if the old password is incorrect', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/change-password',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: {
          currentPassword: 'wrongOldPassword',
          newPassword: newPassword,
        },
      });

      expect(res.statusCode).to.equal(401);
    });

    it('should reject if new password is missing (payload validation)', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/change-password',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: {
          currentPassword: oldPassword,
          // newPassword is missing
        },
      });

      expect(res.statusCode).to.equal(400); // Bad Request
    });

    it('should reject if old password is missing (payload validation)', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/change-password',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: {
          // oldPassword is missing
          newPassword: newPassword,
        },
      });

      expect(res.statusCode).to.equal(400); // Bad Request
    });
  });
});
