'use strict';

import pool from '../../src/database.js';

// Helper to clear test data from database
export const clearTestData = async () => {
  try {
    // Clear test data - be careful with this in production!
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test_%@example.com']);
    await pool.query('DELETE FROM users WHERE username LIKE $1', ['testuser_%']);
    await pool.query('DELETE FROM users WHERE username LIKE $1', ['user_%']);
    console.log('✅ Test data cleared');
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    throw error;
  }
};

// Helper to create test user directly in database
export const createTestUserInDB = async (userData) => {
  const query = `
    INSERT INTO users (username, email, password_hash, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, username, email, created_at
  `;

  try {
    const result = await pool.query(query, [userData.username, userData.email, userData.passwordHash]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error creating test user in DB:', error);
    throw error;
  }
};

// Helper to check if user exists in database
export const userExistsInDB = async (identifier) => {
  const query = `
    SELECT id, username, email
    FROM users
    WHERE username = $1 OR email = $1
  `;

  try {
    const result = await pool.query(query, [identifier]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('❌ Error checking user existence:', error);
    throw error;
  }
};

// Helper to get database connection stats
export const getConnectionStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};
