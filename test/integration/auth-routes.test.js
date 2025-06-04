'use strict';
import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../../src/server.js';
import { clearTestData } from '../helpers/db-helpers.js';

export const lab = Lab.script();
const { before, after, describe, it } = lab;

describe('Auth Routes', () => {
  let server;

  before(async () => {
    server = await init();
  });

  after(async () => {
    await server.stop();
    await clearTestData();
  });

  describe('POST /api/v1/users/register', () => {
    it('should successfully register a new user', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/users/register',
        payload: {
          username: 'testUser1',
          email: 'test1@example.com',
          password: 'newpass123',
        },
      });

      expect(res.statusCode).to.equal(201);
      expect(res.result).to.be.an.object();
      expect(res.result.message).to.exist();
    });

    it('should reject registration with invalid email', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/users/register',
        payload: {
          username: 'testUserInvalid',
          email: 'invalid-email',
          password: 'newpass123',
        },
      });

      expect(res.statusCode).to.equal(400);
    });

    it('should reject registration with missing fields', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/users/register',
        payload: {
          username: 'testUserInvalid',
          // missing email and password
        },
      });

      expect(res.statusCode).to.equal(400);
    });

    it('should reject registration with duplicate username', async () => {
      // First registration
      await server.inject({
        method: 'POST',
        url: '/api/v1/users/register',
        payload: {
          username: 'testuserDuplicate1',
          email: 'test_duplicate@example.com',
          password: 'password123',
        },
      });

      // Duplicate registration
      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/users/register',
        payload: {
          username: 'testuserDuplicate1',
          email: 'test_duplicate@example.com',
          password: 'password123',
        },
      });

      expect(res.statusCode).to.equal(409); // Conflict
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      await server.inject({
        method: 'POST',
        url: '/api/v1/users/register',
        payload: {
          username: 'testUser2',
          email: 'test2@example.com',
          password: 'password123',
        },
      });

      // Then login
      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/users/login',
        payload: {
          email: 'test2@example.com',
          password: 'password123',
        },
      });

      expect(res.statusCode).to.equal(200);
      expect(res.result.data.token).to.exist();
    });

    it('should reject login with invalid credentials', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/users/login',
        payload: {
          email: 'testinvalid@example.com',
          password: 'password123',
        },
      });

      expect(res.statusCode).to.equal(404);
    });
  });
});
