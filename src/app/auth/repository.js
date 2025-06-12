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
   * Stores a refresh token in the database
   * @param {Object} tokenData - Token data
   * @param {string} tokenData.userId - User ID
   * @param {string} tokenData.token - Refresh token
   * @param {Date} tokenData.expiresAt - Expiration date
   * @returns {Promise<Object>} Created token record
   */
  async storeRefreshToken(tokenData) {
    try {
      const { userId, token, expiresAt } = tokenData;

      if (!userId || !token || !expiresAt) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'UserId, token, and expiresAt are required';
        throw error;
      }

      const validatedUserId = validateUUID(userId);

      const sql = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, token, expires_at, created_at;
    `;
      const params = [validatedUserId, token, expiresAt];

      const result = await query(sql, params);

      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        throw new Error('Failed to store refresh token');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }

      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }

      console.error('Unexpected error in AuthRepository.storeRefreshToken:', error);
      throw error;
    }
  }

  /**
   * Finds a refresh token in the database
   * @param {string} token - Refresh token to find
   * @returns {Promise<Object|null>} Token record or null
   */
  async findRefreshToken(token) {
    try {
      if (!token) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Token is required';
        throw error;
      }

      const sql = `
      SELECT id, user_id, token, expires_at, created_at
      FROM refresh_tokens
      WHERE token = $1;
    `;
      const params = [token];

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

      console.error('Unexpected error in AuthRepository.findRefreshToken:', error);
      throw error;
    }
  }

  /**
   * [NEW] Finds a user by their refresh token.
   * Joins refresh_tokens and users tables for efficiency.
   * @param {string} token - The refresh token to search for.
   * @returns {Promise<Object|null>} Joined user and token object or null if not found.
   */
  async findUserByRefreshToken(token) {
    try {
      if (!token) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Token is required';
        throw error;
      }

      const sql = `
        SELECT
          u.id AS user_id,
          u.username,
          u.email,
          rt.token,
          rt.expires_at
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token = $1;
      `;
      const params = [token];
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
      console.error('Unexpected error in AuthRepository.findUserByRefreshToken:', error);
      throw error;
    }
  }

  /**
   * Deletes a specific refresh token.
   * @param {string} token - Refresh token to delete.
   * @returns {Promise<boolean>} True if a row was deleted, otherwise false.
   */
  async deleteRefreshToken(token) {
    try {
      if (!token) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Token is required';
        throw error;
      }

      const sql = `
        DELETE FROM refresh_tokens
        WHERE token = $1;
      `;
      const params = [token];
      const result = await query(sql, params);

      return result.rowCount > 0;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }
      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }
      console.error('Unexpected error in AuthRepository.deleteRefreshToken:', error);
      throw error;
    }
  }

  /**
   * Deletes all refresh tokens for a specific user (logout from all devices).
   * @param {string} userId - User ID.
   * @returns {Promise<number>} The number of tokens that were deleted.
   */
  async deleteAllRefreshTokensForUser(userId) {
    try {
      if (!userId) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'UserId is required';
        throw error;
      }

      const validatedUserId = validateUUID(userId);

      const sql = `
        DELETE FROM refresh_tokens
        WHERE user_id = $1;
      `;
      const params = [validatedUserId];
      const result = await query(sql, params);

      return result.rowCount;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }
      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }
      console.error('Unexpected error in AuthRepository.deleteAllRefreshTokensForUser:', error);
      throw error;
    }
  }
}

export default AuthRepository;
