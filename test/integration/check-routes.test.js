'use strict';

import Lab from '@hapi/lab';
import { init } from '../../src/server.js';
import { createAuthenticatedUserAndGetToken, getAuthToken } from '../helpers/test-helpers.js';
import { clearTestData, createTestCheckResults } from '../helpers/db-helpers.js';
import { expect } from '@hapi/code';

export const lab = Lab.script();
const { before, beforeEach, after, describe, it } = lab;

describe('Check Route', () => {
  let server;
  let authToken;
  let userId;

  before(async () => {
    server = await init();
  });

  after(async () => {
    await server.stop();
    await clearTestData();
  });

  beforeEach(async () => {
    await clearTestData();
    const authData = await createAuthenticatedUserAndGetToken(server);
    userId = authData.userId;
    authToken = authData.authToken;
  });

  describe('GET /api/v1/users/checks', () => {
    it('should return health check history when records exist for the user', async () => {
      await createTestCheckResults(userId, 5);

      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/users/checks',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
      });

      // Assert: Check the response
      const payload = JSON.parse(res.payload);
      expect(res.statusCode).to.equal(200);
      expect(payload.status).to.equal('success');
      expect(payload.data.history).to.be.an.array();
      expect(payload.data.history.length).to.equal(5);
      expect(payload.data.history[0]).to.include([
        'id',
        'bmi',
        'age',
        'income',
        'phys_hlth',
        'education',
        'gen_hlth',
        'high_bp',
        'diabetes_result',
        'created_at',
      ]);
    });

    it('should return an empty array when the user has no health check history', async () => {
      await clearTestData();
      // Need to create a user to get a token, even if they have no checks
      const authData = await createAuthenticatedUserAndGetToken(server);
      authToken = authData.authToken;

      // Act: Make the API call
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/users/checks',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
      });

      // Assert
      const payload = JSON.parse(res.payload);
      expect(res.statusCode).to.equal(200);
      expect(payload.data.history).to.be.an.array().and.be.empty();
    });

    it('should return 401 Unauthorized if no authentication token is provided', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/users/checks',
      });

      expect(res.statusCode).to.equal(401);
    });
  });

  describe('POST /api/v1/users/checks', () => {
    // This payload now uses the correct integer values as per the Joi schema
    const validCheckPayload = {
      bmi: 25,
      age: 3,
      income: 8,
      education: 6,
      gen_hlth: 5,
      phys_hlth: 0,
      high_bp: 0,
    };

    it('should create a new health check record successfully', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/users/checks',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: validCheckPayload,
      });

      const payload = JSON.parse(res.payload);
      expect(res.statusCode).to.equal(201);
      expect(payload.status).to.equal('success');
      expect(payload.data.check).to.be.an.object();
      expect(payload.data.check.id).to.exist();
      expect(payload.data.check.user_id).to.equal(userId);
      expect(payload.data.check.bmi).to.equal(validCheckPayload.bmi);
    });

    it('should return 400 Bad Request for invalid payload data', async () => {
      // Invalid age (10 is not in the valid list)
      const invalidPayload = { ...validCheckPayload, age: 10 };

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/users/checks',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: invalidPayload,
      });

      expect(res.statusCode).to.equal(400);
    });

    it('should return 401 Unauthorized if no authentication token is provided', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/users/checks',
        payload: validCheckPayload,
      });

      expect(res.statusCode).to.equal(401);
    });
  });

  describe('DELETE /api/v1/users/checks/{id}', () => {
    let userOneAuth;
    let userTwoAuth;

    beforeEach(async () => {
      // Clear data and create two distinct users for ownership tests
      await clearTestData();
      userOneAuth = await createAuthenticatedUserAndGetToken(server);
      userTwoAuth = await createAuthenticatedUserAndGetToken(server);
    });

    it('should allow a user to delete their own health check record', async () => {
      const [recordToDelete] = await createTestCheckResults(userOneAuth.userId, 1);

      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/users/checks/${recordToDelete.id}`,
        headers: { Authorization: `Bearer ${userOneAuth.authToken.accessToken}` },
      });

      const payload = JSON.parse(res.payload);
      expect(res.statusCode).to.equal(200);
      expect(payload.status).to.equal('success');
      expect(payload.message).to.equal('Health check record deleted successfully.');
    });

    it("should return 403 Forbidden when a user tries to delete another user's record", async () => {
      const [recordToDelete] = await createTestCheckResults(userTwoAuth.userId, 1);

      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/users/checks/${recordToDelete.id}`,
        headers: { Authorization: `Bearer ${userOneAuth.authToken.accessToken}` },
      });

      const payload = JSON.parse(res.payload);
      expect(res.statusCode).to.equal(403);
      expect(payload.error).to.equal('FORBIDDEN_ACCESS');
    });

    it('should return 404 Not Found when trying to delete a record that does not exist', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/users/checks/${nonExistentId}`,
        headers: { Authorization: `Bearer ${userOneAuth.authToken.accessToken}` },
      });

      const payload = JSON.parse(res.payload);
      expect(res.statusCode).to.equal(404);
      expect(payload.error).to.equal('NOT_FOUND');
    });

    it('should return 400 Bad Request for an invalid UUID format', async () => {
      const invalidId = 'not-a-valid-uuid';
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/users/checks/${invalidId}`,
        headers: { Authorization: `Bearer ${userOneAuth.authToken.accessToken}` },
      });

      expect(res.statusCode).to.equal(400);
    });

    it('should return 401 Unauthorized if no authentication token is provided', async () => {
      const [recordToDelete] = await createTestCheckResults(userOneAuth.userId, 1);
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/users/checks/${recordToDelete.id}`,
      });

      expect(res.statusCode).to.equal(401);
    });
  });

  describe('POST /api/v1/checks', () => {
    // This payload also uses the correct integer values now
    const publicPayload = {
      bmi: 28.1,
      age: 9,
      income: 8,
      phys_hlth: 30,
      education: 3,
      gen_hlth: 5,
      high_bp: 0,
    };

    it('should create a new health check record successfully and get prediction', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/checks',
        payload: publicPayload,
      });

      const payload = JSON.parse(res.payload);
      expect(res.statusCode).to.equal(201);
      expect(payload.status).to.equal('success');
    });
  });
});
