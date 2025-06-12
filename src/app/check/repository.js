import { query } from '../../database.js';

class CheckRepository {
  /**
   * Retrieves all health check records for a given user from the database.
   * @param {string} userId - The UUID of the user.
   * @returns {Promise<Array>} A list of health check objects.
   * @throws {Error} Throws a DATABASE_CONNECTION_ERROR or other errors from the db.
   */
  async getHistoryByUserId(userId) {
    try {
      const sql = `
        SELECT
          id,
          bmi,
          age,
          income,
          phys_hlth,
          education,
          gen_hlth,
          high_bp,
          diabetes_result,
          created_at
        FROM check_results
        WHERE user_id = $1
        ORDER BY created_at DESC;
      `;

      const params = [userId];
      const result = await query(sql, params);

      return result.rows;
    } catch (error) {
      // Handle specific database connection errors, making them more generic
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }

      // For any other unexpected errors, log it and re-throw
      console.error('Unexpected error in CheckRepository.getHistoryByUserId:', error);
      throw error;
    }
  }

  /**
   * Creates a new health check record in the database.
   * @param {Object} data - The health check data to insert.
   * @returns {Promise<Object>} The created record object.
   * @throws {Error} Throws database errors.
   */
  async create(data) {
    try {
      const sql = `
        INSERT INTO check_results (
          user_id, bmi, age, income, phys_hlth, education, gen_hlth, high_bp, diabetes_result
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id, bmi, age, income, phys_hlth, education, gen_hlth, high_bp, diabetes_result, created_at;
      `;

      const params = [
        data.userId,
        data.bmi,
        data.age,
        data.income,
        data.phys_hlth,
        data.education,
        data.gen_hlth,
        data.high_bp,
        data.diabetes_result,
      ];

      const result = await query(sql, params);
      return result.rows[0];
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }
      // Handle foreign key violation if user_id doesn't exist
      if (error.code === '23503') {
        throw new Error('INVALID_USER_ID');
      }
      console.error('Unexpected error in CheckRepository.create:', error);
      throw error;
    }
  }

  /**
   * Finds a single health check record by its primary key (ID).
   * @param {string} id - The UUID of the health check record.
   * @returns {Promise<Object|null>} The record object or null if not found.
   */
  async findById(id) {
    try {
      const sql = `SELECT * FROM check_results WHERE id = $1`;
      const result = await query(sql, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Unexpected error in CheckRepository.findById:', error);
      throw error;
    }
  }

  /**
   * Deletes a health check record from the database by its ID.
   * @param {string} id - The ID of the record to delete.
   * @returns {Promise<number>} The number of rows deleted (should be 1 or 0).
   */
  async deleteById(id) {
    try {
      const sql = `DELETE FROM check_results WHERE id = $1`;
      const result = await query(sql, [id]);
      return result.rowCount; // Number of rows affected
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }
      console.error('Unexpected error in CheckRepository.deleteById:', error);
      throw error;
    }
  }
}

export default CheckRepository;
