class CheckService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Private method to get a diabetes prediction from the Hugging Face Inference API.
   * @param {Object} checkData - The health data for prediction.
   * @returns {Promise<Object>} The prediction result from the API.
   * @throws {Error} Throws prediction failure errors.
   * @private
   */
  async _getHuggingFacePrediction(checkData) {
    try {
      const HUGGING_FACE_API_URL = process.env.HUGGING_FACE_API_URL;

      const payload = {
        inputs: {
          bmi: checkData.bmi,
          age: checkData.age,
          genhlth: checkData.gen_hlth,
          income: checkData.income,
          highBP: checkData.high_bp,
          education: checkData.education,
          physhlth: checkData.phys_hlth,
        },
      };

      const response = await fetch(HUGGING_FACE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Hugging Face API error: ${response.statusText}`);
        throw new Error('PREDICTION_FAILED');
      }

      const { predictions } = await response.json();

      if (Array.isArray(predictions)) {
        // Find the prediction with the highest score
        const topPrediction = predictions.reduce((prev, current) => (prev.score > current.score ? prev : current));

        // --- Change is here ---
        // Map the string label to an integer
        if (topPrediction.label === 'non-diabetic') {
          return 0;
        }
        if (topPrediction.label === 'diabetic') {
          return 1;
        }
        // If the label is something unexpected, throw an error
        throw new Error('Unexpected prediction label received.');
      }

      // Fallback for unexpected API response structure
      throw new Error('Unexpected prediction format received.');
    } catch (error) {
      if (error.message === 'PREDICTION_FAILED') {
        throw error;
      }
      console.error('Unexpected error in _getHuggingFacePrediction:', error);
      throw new Error('PREDICTION_FAILED');
    }
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
      const requiredFields = ['userId', 'bmi', 'age', 'income', 'phys_hlth', 'education', 'gen_hlth', 'high_bp'];
      for (const field of requiredFields) {
        if (checkData[field] === undefined || checkData[field] === null) {
          const error = new Error('VALIDATION_ERROR');
          error.details = `Missing required field: ${field}`;
          throw error;
        }
      }

      const diabetesResult = await this._getHuggingFacePrediction(checkData);
      checkData.diabetes_result = diabetesResult;
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
      const checkRecord = await this.repository.findById(checkId);
      if (!checkRecord) {
        throw new Error('NOT_FOUND');
      }

      if (checkRecord.user_id !== userId) {
        throw new Error('FORBIDDEN');
      }

      await this.repository.deleteById(checkId);
    } catch (error) {
      if (error.message === 'NOT_FOUND' || error.message === 'FORBIDDEN') {
        throw error;
      }
      console.error('Unexpected error in deleteCheckHistory service:', error);
      throw new Error('Failed to delete health check record due to an unexpected error.');
    }
  }

  /**
   * Public-facing method to get a diabetes prediction.
   * This acts as a proxy to the internal prediction logic.
   * @param {Object} checkData - The health data for prediction.
   * @returns {Promise<Object>} The prediction result from the API.
   */
  async getPublicDiabetesPrediction(checkData) {
    return this._getHuggingFacePrediction(checkData);
  }
}

export default CheckService;
