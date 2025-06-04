import { query } from '../../database.js';
import { validateUUID } from '../../utils/uuidUtils.js';

class AuthRepository {
  /**
   * Creates a new user in the database
   * @param {Object} user - User data object
   * @param {string} user.username - The username
   * @param {string} user.email - The email address
   * @param {string} user.hashedPassword - The hashed password
   * @returns {Promise<Object>} Created user object without password
   * @throws {Error} Database connection or constraint violation errors
   */
  async create(user) {
    try {
      const { username, email, hashedPassword } = user;

      // Validate input parameters
      if (!username || !email || !hashedPassword) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Username, email, and hashedPassword are required';
        throw error;
      }

      const sql = `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at, updated_at;
      `;
      const params = [username, email, hashedPassword];

      const result = await query(sql, params);

      if (result.rows.length > 0) {
        // Exclude password_hash from the returned user object
        const { password_hash, ...userWithoutPassword } = result.rows[0];
        return userWithoutPassword;
      } else {
        throw new Error('Failed to create user - no data returned');
      }
    } catch (error) {
      // Handle database connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }

      // Re-throw database constraint errors (like unique violations)
      if (error.code && error.code.startsWith('23')) {
        throw error;
      }

      // Re-throw validation errors
      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }

      // Log and re-throw unexpected errors
      console.error('Unexpected error in UserRepository.create:', error);
      throw error;
    }
  }

  /**
   * Finds a user by email address
   * @param {string} email - The email address to search for
   * @returns {Promise<Object|null>} User object with password hash or null if not found
   * @throws {Error} Database connection errors
   */
  async findByEmail(email) {
    try {
      if (!email) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Email is required';
        throw error;
      }

      const sql = `
        SELECT id, username, email, password_hash, created_at, updated_at
        FROM users
        WHERE email = $1;
      `;
      const params = [email];

      const result = await query(sql, params);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }

      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }

      console.error('Unexpected error in UserRepository.findByEmail:', error);
      throw error;
    }
  }

  /**
   * Finds a user by username
   * @param {string} username - The username to search for
   * @returns {Promise<Object|null>} User object without password hash or null if not found
   * @throws {Error} Database connection errors
   */
  async findByUsername(username) {
    try {
      if (!username) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Username is required';
        throw error;
      }

      const sql = `
        SELECT id, username, email, created_at, updated_at
        FROM users
        WHERE username = $1;
      `;
      const params = [username];

      const result = await query(sql, params);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }

      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }

      console.error('Unexpected error in UserRepository.findByUsername:', error);
      throw error;
    }
  }

  /**
   * Finds a user by ID
   * @param {number} id - The user ID to search for
   * @returns {Promise<Object|null>} User object without password hash or null if not found
   * @throws {Error} Database connection errors
   */
  async findById(id) {
    try {
      const validateId = validateUUID(id);

      const sql = `
        SELECT id, username, email, created_at, updated_at
        FROM users
        WHERE id = $1;
      `;
      const params = [validateId];
      const result = await query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }

      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }

      console.error('Unexpected error in UserRepository.findById:', error);
      throw error;
    }
  }

  /**
   * Adds a token to the blacklist to prevent its reuse
   * @param {Object} tokenData - Token blacklist data
   * @param {string} tokenData.token - The JWT token to blacklist
   * @param {string} tokenData.userId - The user ID associated with the token
   * @param {Date} tokenData.expiresAt - When the token expires
   * @returns {Promise<Object>} Created blacklist entry
   * @throws {Error} Database connection or validation errors
   */
  async blacklistToken(tokenData) {
    try {
      const { token, userId, expiresAt } = tokenData;

      // Validate input parameters
      if (!token || !userId || !expiresAt) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Token, userId, and expiresAt are required';
        throw error;
      }

      // Validate userId format
      const validatedUserId = validateUUID(userId);

      // Check if token is already blacklisted
      const existingEntry = await this.isTokenBlacklisted(token);
      if (existingEntry) {
        throw new Error('TOKEN_ALREADY_INVALIDATED');
      }

      const sql = `
      INSERT INTO token_blacklist (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, token, user_id, expires_at, created_at;
    `;
      const params = [token, validatedUserId, expiresAt];

      const result = await query(sql, params);

      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        throw new Error('Failed to blacklist token - no data returned');
      }
    } catch (error) {
      // Handle database connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }

      // Re-throw known errors
      if (error.message === 'VALIDATION_ERROR' || error.message === 'TOKEN_ALREADY_INVALIDATED') {
        throw error;
      }

      // Re-throw database constraint errors
      if (error.code && error.code.startsWith('23')) {
        throw error;
      }

      // Log and re-throw unexpected errors
      console.error('Unexpected error in AuthRepository.blacklistToken:', error);
      throw error;
    }
  }

  /**
   * Checks if a token is blacklisted
   * @param {string} token - The JWT token to check
   * @returns {Promise<boolean>} True if token is blacklisted, false otherwise
   * @throws {Error} Database connection errors
   */
  async isTokenBlacklisted(token) {
    try {
      if (!token) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Token is required';
        throw error;
      }

      const sql = `
      SELECT id, expires_at
      FROM token_blacklist
      WHERE token = $1 AND expires_at > NOW();
    `;
      const params = [token];

      const result = await query(sql, params);

      return result.rows.length > 0;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }

      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }

      console.error('Unexpected error in AuthRepository.isTokenBlacklisted:', error);
      throw error;
    }
  }
}

export default AuthRepository;
