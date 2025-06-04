class UserHandler {
  constructor(authService) {
    this.authService = authService;

    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.changePassword = this.changePassword.bind(this);
  }

  /**
   * Handles get user profile requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with user profile data or error
   */
  async getProfile(request, h) {
    try {
      const userId = request.auth.credentials.id;
      const user = await this.authService.getUserProfile(userId);

      return h
        .response({
          status: 'success',
          message: 'Profile retrieved successfully',
          data: {
            user,
          },
        })
        .code(200);
    } catch (error) {
      if (error.message === 'USER_NOT_FOUND') {
        return h
          .response({
            status: 'error',
            message: 'User not found',
            error: 'USER_NOT_FOUND',
          })
          .code(404);
      }

      if (error.message === 'DATABASE_CONNECTION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Service temporarily unavailable',
            error: 'SERVICE_UNAVAILABLE',
          })
          .code(503);
      }

      console.error('Unexpected error in getProfile handler:', error);

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
   * Handles update user profile requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with updated user data or error
   */
  async updateProfile(request, h) {
    try {
      const userId = request.auth.credentials.id;
      const updates = request.payload;

      const updatedUser = await this.authService.updateUserProfile(userId, updates);

      return h
        .response({
          status: 'success',
          message: 'Profile updated successfully',
          data: {
            user: updatedUser,
          },
        })
        .code(200);
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL unique violation
        if (error.message.includes('USERNAME_ALREADY_EXISTS')) {
          return h
            .response({
              status: 'error',
              message: 'Username already exists',
              error: 'DUPLICATE_USERNAME',
            })
            .code(409);
        }
        if (error.message.includes('EMAIL_ALREADY_EXISTS')) {
          return h
            .response({
              status: 'error',
              message: 'Email already exists',
              error: 'DUPLICATE_EMAIL',
            })
            .code(409);
        }
      }

      if (error.message === 'USER_NOT_FOUND') {
        return h
          .response({
            status: 'error',
            message: 'User not found',
            error: 'USER_NOT_FOUND',
          })
          .code(404);
      }

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

      if (error.message === 'DATABASE_CONNECTION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Service temporarily unavailable',
            error: 'SERVICE_UNAVAILABLE',
          })
          .code(503);
      }

      console.error('Unexpected error in updateProfile handler:', error);

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
   * Handles change password requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response confirming password change or error
   */
  async changePassword(request, h) {
    try {
      const userId = request.auth.credentials.id;
      const { currentPassword, newPassword } = request.payload;

      await this.authService.changePassword(userId, currentPassword, newPassword);

      return h
        .response({
          status: 'success',
          message: 'Password changed successfully',
        })
        .code(200);
    } catch (error) {
      if (error.message === 'INVALID_CREDENTIALS') {
        return h
          .response({
            status: 'error',
            message: 'Current password is incorrect',
            error: 'INVALID_CREDENTIALS',
          })
          .code(401);
      }

      if (error.message === 'USER_NOT_FOUND') {
        return h
          .response({
            status: 'error',
            message: 'User not found',
            error: 'USER_NOT_FOUND',
          })
          .code(404);
      }

      if (error.message === 'DATABASE_CONNECTION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Service temporarily unavailable',
            error: 'SERVICE_UNAVAILABLE',
          })
          .code(503);
      }

      console.error('Unexpected error in changePassword handler:', error);

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

export default UserHandler;
