class AuthHandler {
  constructor(authService) {
    this.authService = authService;

    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
  }

  /**
   * Handles user registration requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with user data or error
   */
  async register(request, h) {
    try {
      const { username, email, password } = request.payload;
      const newUser = await this.authService.register({ username, email, password });

      return h
        .response({
          status: 'success',
          message: 'User registered successfully!',
          data: {
            user: {
              id: newUser.id,
              username: newUser.username,
              email: newUser.email,
              createdAt: newUser.created_at,
            },
          },
        })
        .code(201);
    } catch (error) {
      // Handle different types of errors
      // Debug: Log the entire error object to see its structure
      if (error.code === '23505') {
        if (error.message.includes('USERNAME_ALREADY_EXISTS')) {
          return h
            .response({
              status: 'error',
              message: error.details,
              error: 'DUPLICATE_USERNAME',
            })
            .code(409);
        }
        if (error.message.includes('EMAIL_ALREADY_EXISTS')) {
          return h
            .response({
              status: 'error',
              message: error.details,
              error: 'DUPLICATE_EMAIL',
            })
            .code(409);
        }
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

      // Log unexpected errors for debugging
      console.error('Unexpected error in register handler:', error);

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
   * Handles user login requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with authentication token or error
   */
  async login(request, h) {
    try {
      const { email, password } = request.payload;

      const result = await this.authService.login({ email, password });

      return h
        .response({
          status: 'success',
          message: 'Login successful',
          data: {
            user: result.user,
            token: result.token,
          },
        })
        .code(200);
    } catch (error) {
      if (error.message === 'INVALID_CREDENTIALS') {
        return h
          .response({
            status: 'error',
            message: 'Invalid email or password',
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

      console.error('Unexpected error in login handler:', error);

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
}

export default AuthHandler;
