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
        'ment_hlth',
        'diabetes_result',
        'created_at',
      ]);
    });

    it('should return an empty array when the user has no health check history', async () => {
      await clearTestData();
      authToken = await getAuthToken(server);

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
    const validCheckPayload = {
      bmi: 24.5,
      age: 35,
      income: 50000,
      phys_hlth: 'medium',
      education: 'college',
      gen_hlth: 'high',
      ment_hlth: 'high',
      diabetes_result: 'non-diabetic',
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
      const invalidPayload = { ...validCheckPayload, age: -5 }; // Invalid age

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
});
