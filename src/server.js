'use strict';
import Hapi from '@hapi/hapi';
import config from './config/index.js';
import authRoutes from './app/auth/routes.js';
import userRoutes from './app/user/routes.js';
import Joi from 'joi';
import Jwt from '@hapi/jwt';

let serverInstance = null;

const createServer = async () => {
  const server = Hapi.server({
    port: config.server.port,
    host: config.server.host,
    routes: {
      cors: {
        origin: ['*'], // Configure properly for production
      },
      validate: {
        // Global failAction for validation, can be overridden per route
        failAction: (request, h, err) => {
          console.error('Global Validation FailAction:', err.message);
          // For production, you might not want to expose err.details directly
          // Consider transforming the error into a standard format.
          throw err;
        },
      },
    },
  });

  // Configure Joi as the default validator
  server.validator(Joi);

  // Register jwt with the server
  await server.register(Jwt);

  // Define JWT authentication strategy
  server.auth.strategy('jwt', 'jwt', {
    keys: config.jwt.secret,
    verify: {
      aud: config.jwt.audience,
      iss: config.jwt.issuer,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: 14400, // 4 hours
      timeSkewSec: 15,
    },
    validate: (artifacts, request, h) => {
      const payload = artifacts.decoded.payload;
      return {
        isValid: true,
        credentials: payload,
      };
    },
  });

  // Set the strategy
  server.auth.default('jwt');

  // Register routes
  const allRoutes = [...authRoutes, ...userRoutes];
  server.route(allRoutes);

  return server;
};

// For testing - initialize but don't start
export const init = async () => {
  const server = await createServer();
  await server.initialize();
  return server;
};

// For production - initialize and start
export const start = async () => {
  const server = await createServer();
  serverInstance = server;

  try {
    await server.start();
    console.log(`🚀 Server running on ${server.info.uri}`);
    return server;
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

// Export server instance for graceful shutdown
export const getServerInstance = () => serverInstance;
