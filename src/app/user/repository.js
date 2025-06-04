import { query } from '../../database.js';
import { validateUUID } from '../../utils/uuidUtils.js';

class UserRepository {
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
   * Updates user information
   * @param {number} id - The user ID to update
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<Object|null>} Updated user object without password hash or null if not found
   * @throws {Error} Database connection or validation errors
   */
  async update(id, updates) {
    try {
      const validateId = validateUUID(id);

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
      params.push(validateId);

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

  /**
   * Updates user password
   * @param {string} id - The user ID
   * @param {string} hashedPassword - The new hashed password
   * @returns {Promise<Object|null>} Updated user object without password hash or null if not found
   * @throws {Error} Database connection or validation errors
   */
  async updatePassword(id, hashedPassword) {
    try {
      const validateId = validateUUID(id);

      if (!hashedPassword) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Hashed password is required';
        throw error;
      }

      const sql = `
        UPDATE users
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, username, email, created_at, updated_at;
      `;
      const params = [hashedPassword, validateId];

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

      console.error('Unexpected error in UserRepository.updatePassword:', error);
      throw error;
    }
  }

  /**
   * Finds a user by ID including password hash (for authentication purposes)
   * @param {string} id - The user ID to search for
   * @returns {Promise<Object|null>} User object with password hash or null if not found
   * @throws {Error} Database connection errors
   */
  async findByIdWithPassword(id) {
    try {
      const validateId = validateUUID(id);

      const sql = `
        SELECT id, username, email, password_hash, created_at, updated_at
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

      console.error('Unexpected error in UserRepository.findByIdWithPassword:', error);
      throw error;
    }
  }
}

export default UserRepository;
