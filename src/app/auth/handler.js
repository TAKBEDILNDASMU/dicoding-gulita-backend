class AuthHandler {
  constructor(authService) {
    this.authService = authService;

    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
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
   * Handles user logout requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response confirming logout or error
   */
  async logout(request, h) {
    try {
      // Extract token from request (usually from Authorization header)
      const token = request.auth.token;

      // Call the auth service to handle logout (token invalidation)
      await this.authService.logout({ token });

      return h
        .response({
          status: 'success',
          message: 'Logout successful',
        })
        .code(200);
    } catch (error) {
      if (error.message === 'INVALID_TOKEN') {
        return h
          .response({
            status: 'error',
            message: 'Invalid or expired token',
            error: 'INVALID_TOKEN',
          })
          .code(401);
      }

      if (error.message === 'TOKEN_ALREADY_INVALIDATED') {
        return h
          .response({
            status: 'error',
            message: 'Token already invalidated',
            error: 'TOKEN_ALREADY_INVALIDATED',
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

      console.error('Unexpected error in logout handler:', error);

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
