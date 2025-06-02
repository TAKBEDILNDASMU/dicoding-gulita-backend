'use strict';

import Hapi from '@hapi/hapi';
import config from './config/index.js';
import userRoutes from './api/users/userRoutes.js';
import loggingPlugin from './plugins/logging.js'; // Uncomment to use

const init = async () => {
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

  // Register plugins (example)
  await server.register(loggingPlugin);

  // Register routes
  server.route({
    // Simple root route for health check / info
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return {
        message: 'Welcome to the API!',
        status: 'running',
        timestamp: new Date().toISOString(),
      };
    },
    options: {
      tags: ['api', 'health'],
      description: 'API root/health check',
    },
  });
  server.route(userRoutes); // Register all user-related routes

  try {
    await server.start();
    console.log(`🚀 Server running on ${server.info.uri}`);
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Rejection:', err);
  // Graceful shutdown logic could go here
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  // Add any cleanup tasks here (e.g., close database connections)
  // await server.stop({ timeout: 10000 }); // If you need to wait for server.stop()
  process.exit(0);
});

init();
