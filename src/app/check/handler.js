class CheckHandler {
  constructor(checkService) {
    this.checkService = checkService;

    this.getCheckHistory = this.getCheckHistory.bind(this);
    this.createCheckHistory = this.createCheckHistory.bind(this);
    this.deleteCheckHistory = this.deleteCheckHistory.bind(this);
  }

  /**
   * Handles request to get user's health check history
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with check history data or error
   */
  async getCheckHistory(request, h) {
    try {
      // Extract user ID from the authenticated credentials
      const { id: userId } = request.auth.credentials;
      const history = await this.checkService.getHistoryByUserId(userId);

      // Check if history is empty and respond accordingly
      if (!history || history.length === 0) {
        return h
          .response({
            status: 'success',
            message: 'No health check history found for this user.',
            data: {
              history: [],
            },
          })
          .code(200);
      }

      return h
        .response({
          status: 'success',
          message: 'Health check history retrieved successfully.',
          data: {
            history,
          },
        })
        .code(200);
    } catch (error) {
      // Log unexpected errors for debugging
      console.error('Unexpected error in getCheckHistory handler:', error);

      // Return a generic server error response
      return h
        .response({
          status: 'error',
          message: 'An unexpected error occurred',
          error: 'INTERNAL_SERVER_ERROR',
        })
        .code(500);
    }
  }

  /**
   * Handles request to create a new health check entry.
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with the created data or an error
   */
  async createCheckHistory(request, h) {
    try {
      const { id: userId } = request.auth.credentials;
      const checkData = { ...request.payload, userId }; // Add userId to the data object

      const newCheck = await this.checkService.createCheckHistory(checkData);

      return h
        .response({
          status: 'success',
          message: 'Health check record created successfully.',
          data: {
            check: newCheck,
          },
        })
        .code(201);
    } catch (error) {
      // Handle potential validation errors from the service layer
      if (error.message === 'VALIDATION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Invalid input data',
            error: 'VALIDATION_ERROR',
            details: error.details,
          })
          .code(400);
      }

      console.error('Unexpected error in createCheckHistory handler:', error);
      return h
        .response({
          status: 'error',
          message: 'An unexpected error occurred',
          error: 'INTERNAL_SERVER_ERROR',
        })
        .code(500);
    }
  }

  /**
   * Handles request to delete a health check entry.
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response confirming deletion or an error
   */
  async deleteCheckHistory(request, h) {
    try {
      const { id: userId } = request.auth.credentials;
      const { id: checkId } = request.params;

      await this.checkService.deleteCheckHistory(userId, checkId);

      return h
        .response({
          status: 'success',
          message: 'Health check record deleted successfully.',
        })
        .code(200);
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return h
          .response({
            status: 'error',
            message: 'Health check record not found.',
            error: 'NOT_FOUND',
          })
          .code(404);
      }
      if (error.message === 'FORBIDDEN') {
        return h
          .response({
            status: 'error',
            message: 'You are not authorized to delete this record.',
            error: 'FORBIDDEN_ACCESS',
          })
          .code(403);
      }

      console.error('Unexpected error in deleteCheckHistory handler:', error);
      return h
        .response({
          status: 'error',
          message: 'An unexpected error occurred',
          error: 'INTERNAL_SERVER_ERROR',
        })
        .code(500);
    }
  }
}

export default CheckHandler;
