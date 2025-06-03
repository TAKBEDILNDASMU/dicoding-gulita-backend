import { query } from '../../database.js';

class UserRepository {
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
      if (!id || isNaN(id)) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Valid user ID is required';
        throw error;
      }

      const sql = `
        SELECT id, username, email, created_at, updated_at
        FROM users
        WHERE id = $1;
      `;
      const params = [id];

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
   * Updates user information
   * @param {number} id - The user ID to update
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<Object|null>} Updated user object without password hash or null if not found
   * @throws {Error} Database connection or validation errors
   */
  async update(id, updates) {
    try {
      if (!id || isNaN(id)) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Valid user ID is required';
        throw error;
      }

      if (!updates || Object.keys(updates).length === 0) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'At least one field to update is required';
        throw error;
      }

      // Build dynamic SQL query based on provided updates
      const allowedFields = ['username', 'email'];
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'No valid fields to update';
        throw error;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const sql = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, username, email, created_at, updated_at;
      `;

      const result = await query(sql, params);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }

      if (error.code && error.code.startsWith('23')) {
        throw error;
      }

      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }

      console.error('Unexpected error in UserRepository.update:', error);
      throw error;
    }
  }
}

export default UserRepository;
