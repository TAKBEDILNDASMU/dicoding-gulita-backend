'use strict';
import { start, getServerInstance } from './server.js';
import pool from './database.js';

// Graceful shutdown function
const gracefulShutdown = async () => {
  console.log('🔄 Starting graceful shutdown...');

  const shutdownPromises = [];

  // 1. Stop HTTP server
  const server = getServerInstance();
  if (server) {
    console.log('⏹️  Stopping HTTP server...');
    shutdownPromises.push(
      server
        .stop({ timeout: 10000 })
        .then(() => {
          console.log('✅ HTTP server stopped');
        })
        .catch((err) => {
          console.error('❌ Error stopping server:', err);
        }),
    );
  }

  // 2. Close PostgreSQL pool
  if (pool) {
    console.log('🔌 Closing PostgreSQL pool...');
    shutdownPromises.push(
      pool
        .end()
        .then(() => {
          console.log('✅ PostgreSQL pool closed');
        })
        .catch((err) => {
          console.error('❌ Error closing PostgreSQL pool:', err);
        }),
    );
  }

  // Wait for all cleanup operations
  try {
    await Promise.allSettled(shutdownPromises);
    console.log('✅ Graceful shutdown completed');
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Rejection:', err);
  gracefulShutdown().finally(() => process.exit(1));
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  await gracefulShutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('💥 Uncaught Exception:', err);
  await gracefulShutdown();
  process.exit(1);
});

// Start the server
start();
