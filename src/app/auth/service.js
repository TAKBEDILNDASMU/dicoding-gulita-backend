import { comparePassword, hashPassword } from '../../utils/passwordUtils.js';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Generates a JWT token for authenticated user
   * @private
   * @param {Object} user - User object
   * @param {number} user.id - User ID
   * @param {string} user.email - User email
   * @param {string} user.username - Username
   * @returns {string} JWT token
   * @throws {Error} Token generation errors
   */
  #generateToken(user) {
    try {
      if (!user || !user.id || !user.email) {
        throw new Error('User object with id and email is required for token generation');
      }

      const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
      };

      const secret = config.jwt?.secret;
      if (!secret) {
        throw new Error('JWT secret is not configured');
      }

      const options = {
        expiresIn: config.jwt?.expiresIn || '24h',
        issuer: config.jwt?.issuer || 'your-app-name',
      };

      return jwt.sign(payload, secret, options);
    } catch (error) {
      console.error('Error generating JWT token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Registers a new user
   * @param {Object} params - Registration parameters
   * @param {string} params.username - Username
   * @param {string} params.email - Email address
   * @param {string} params.password - Plain text password
   * @returns {Promise<Object>} Created user object without password
   * @throws {Error} Registration errors including validation and database errors
   */
  async register(params) {
    try {
      const { username, email, password } = params;

      // Validate input parameters
      if (!username || !email || !password) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Username, email, and password are required';
        throw error;
      }

      // Additional business logic validations
      if (password.length < 8) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Password must be at least 8 characters long';
        throw error;
      }

      // Check if user already exists by email
      const existingUserByEmail = await this.userRepository.findByEmail(email);
      if (existingUserByEmail) {
        const error = new Error('EMAIL_ALREADY_EXISTS');
        error.details = 'User with this email already exists';
        error.code = '23505';
        throw error;
      }

      // Check if user already exists by username
      const existingUserByUsername = await this.userRepository.findByUsername(username);
      if (existingUserByUsername) {
        const error = new Error('USERNAME_ALREADY_EXISTS');
        error.details = 'User with this username already exists';
        error.code = '23505';
        throw error;
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create the user
      return await this.userRepository.create({ username, email, hashedPassword });
    } catch (error) {
      // Re-throw known errors
      if (error.message === 'VALIDATION_ERROR' || error.message === 'USER_ALREADY_EXISTS' || error.message === 'DATABASE_CONNECTION_ERROR') {
        throw error;
      }

      // Log and re-throw database constraint errors
      if (error.code && error.code.startsWith('23')) {
        console.error('Database constraint error in register:', error);
        throw error;
      }

      // Log unexpected errors
      console.error('Unexpected error in AuthService.register:', error);
      throw new Error('Registration failed due to an unexpected error');
    }
  }

  /**
   * Authenticates a user and returns user data with token
   * @param {Object} params - Login parameters
   * @param {string} params.email - Email address
   * @param {string} params.password - Plain text password
   * @returns {Promise<Object>} Object containing user data and JWT token
   * @throws {Error} Authentication errors
   */
  async login(params) {
    try {
      const { email, password } = params;

      // Validate input parameters
      if (!email || !password) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Email and password are required';
        throw error;
      }

      // Find user by email (including password hash for verification)
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Remove password hash from user object
      const { password_hash, ...userWithoutPassword } = user;

      // Generate JWT token
      const token = this.#generateToken(userWithoutPassword);

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      // Re-throw known errors
      if (
        error.message === 'VALIDATION_ERROR' ||
        error.message === 'USER_NOT_FOUND' ||
        error.message === 'INVALID_CREDENTIALS' ||
        error.message === 'DATABASE_CONNECTION_ERROR'
      ) {
        throw error;
      }

      // Log unexpected errors
      console.error('Unexpected error in AuthService.login:', error);
      throw new Error('Login failed due to an unexpected error');
    }
  }

  /**
   * Verifies a JWT token and returns the decoded payload
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} Token verification errors
   */
  verifyToken(token) {
    try {
      if (!token) {
        throw new Error('TOKEN_REQUIRED');
      }

      const secret = config.jwt?.secret;
      if (!secret) {
        throw new Error('JWT secret is not configured');
      }

      return jwt.verify(token, secret);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_TOKEN');
      }

      if (error.name === 'TokenExpiredError') {
        throw new Error('TOKEN_EXPIRED');
      }

      if (error.message === 'TOKEN_REQUIRED') {
        throw error;
      }

      console.error('Unexpected error in AuthService.verifyToken:', error);
      throw new Error('Token verification failed');
    }
  }

  /**
   * Refreshes a JWT token
   * @param {string} token - Current JWT token
   * @returns {string} New JWT token
   * @throws {Error} Token refresh errors
   */
  async refreshToken(token) {
    try {
      // Verify the current token
      const decoded = this.verifyToken(token);

      // Get fresh user data
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Generate new token
      return this.#generateToken(user);
    } catch (error) {
      // Re-throw known errors
      if (
        error.message === 'INVALID_TOKEN' ||
        error.message === 'TOKEN_EXPIRED' ||
        error.message === 'USER_NOT_FOUND' ||
        error.message === 'DATABASE_CONNECTION_ERROR'
      ) {
        throw error;
      }

      console.error('Unexpected error in AuthService.refreshToken:', error);
      throw new Error('Token refresh failed');
    }
  }
}

export default AuthService;
