class CheckService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Retrieves the health check history for a specific user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array>} A list of health check history records.
   * @throws {Error} Throws an error if the query fails.
   */
  async getHistoryByUserId(userId) {
    try {
      // Validate that a userId is provided
      if (!userId) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'User ID is required to fetch history.';
        throw error;
      }

      // Retrieve history from the repository
      const history = await this.repository.getHistoryByUserId(userId);
      return history;
    } catch (error) {
      // Re-throw known validation errors
      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }

      // Log unexpected errors for debugging purposes
      console.error('Unexpected error in getHistoryByUserId service:', error);

      // Throw a generic error for other issues
      throw new Error('Failed to retrieve health check history due to an unexpected error.');
    }
  }

  /**
   * Validates and creates a new health check record.
   * @param {Object} checkData - The data for the new health check.
   * @returns {Promise<Object>} The newly created health check record.
   * @throws {Error} Throws validation or other errors.
   */
  async createCheckHistory(checkData) {
    try {
      // Basic validation
      const requiredFields = ['userId', 'bmi', 'age', 'income', 'phys_hlth', 'education', 'gen_hlth', 'ment_hlth', 'diabetes_result'];
      for (const field of requiredFields) {
        if (!checkData[field]) {
          const error = new Error('VALIDATION_ERROR');
          error.details = `Missing required field: ${field}`;
          throw error;
        }
      }

      return await this.repository.create(checkData);
    } catch (error) {
      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }
      console.error('Unexpected error in createCheckHistory service:', error);
      throw new Error('Failed to create health check record due to an unexpected error.');
    }
  }

  /**
   * Deletes a health check record after verifying ownership.
   * @param {string} userId - The ID of the user requesting the deletion.
   * @param {string} checkId - The ID of the check record to delete.
   * @throws {Error} Throws NOT_FOUND if the record doesn't exist, or FORBIDDEN if the user is not the owner.
   */
  async deleteCheckHistory(userId, checkId) {
    try {
      // Step 1: Find the record to verify existence and ownership.
      const checkRecord = await this.repository.findById(checkId);

      // Step 2: If no record is found, throw a NOT_FOUND error.
      if (!checkRecord) {
        throw new Error('NOT_FOUND');
      }

      // Step 3: If the user is not the owner, throw a FORBIDDEN error.
      if (checkRecord.user_id !== userId) {
        throw new Error('FORBIDDEN');
      }

      // Step 4: If checks pass, proceed with deletion.
      await this.repository.deleteById(checkId);
    } catch (error) {
      // Re-throw known errors to be handled by the handler
      if (error.message === 'NOT_FOUND' || error.message === 'FORBIDDEN') {
        throw error;
      }
      console.error('Unexpected error in deleteCheckHistory service:', error);
      throw new Error('Failed to delete health check record due to an unexpected error.');
    }
  }
}

export default CheckService;
