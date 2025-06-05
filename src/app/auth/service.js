import { comparePassword, hashPassword } from '../../utils/passwordUtils.js';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import crypto from 'node:crypto';

class AuthService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Generates a JWT access token for authenticated user (short-lived)
   * @private
   * @param {Object} user - User object
   * @returns {string} JWT access token
   */
  #generateAccessToken(user) {
    try {
      if (!user || !user.id || !user.email) {
        throw new Error('User object with id and email is required for token generation');
      }

      const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
        type: 'access',
      };

      const secret = config.jwt?.secret;
      if (!secret) {
        throw new Error('JWT secret is not configured');
      }

      const options = {
        expiresIn: config.jwt.accessTokenExpiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      };

      return jwt.sign(payload, secret, options);
    } catch (error) {
      console.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generates a secure refresh token (random string)
   * @private
   * @returns {string} Refresh token
   */
  #generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
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
      const existingUserByEmail = await this.repository.findByEmail(email);
      if (existingUserByEmail) {
        const error = new Error('EMAIL_ALREADY_EXISTS');
        error.details = 'User with this email already exists';
        error.code = '23505';
        throw error;
      }

      // Check if user already exists by username
      const existingUserByUsername = await this.repository.findByUsername(username);
      if (existingUserByUsername) {
        const error = new Error('USERNAME_ALREADY_EXISTS');
        error.details = 'User with this username already exists';
        error.code = '23505';
        throw error;
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create the user
      return await this.repository.create({ username, email, hashedPassword });
    } catch (error) {
      // Re-throw known errors
      if (error.message === 'VALIDATION_ERROR' || error.message === 'USER_ALREADY_EXISTS' || error.message === 'DATABASE_CONNECTION_ERROR') {
        throw error;
      }

      // Log and re-throw database constraint errors
      if (error.code && error.code.startsWith('23')) {
        throw error;
      }

      // Log unexpected errors
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
      const user = await this.repository.findByEmail(email);
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

      // Generate tokens
      const accessToken = this.#generateAccessToken(userWithoutPassword);
      const refreshToken = this.#generateRefreshToken();

      // Store refresh token in database
      await this.repository.storeRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
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
   * Handles user logout by invalidating the JWT token
   * @param {Object} params - Logout parameters
   * @param {string} params.token - JWT token to invalidate
   * @returns {Promise<void>} Promise that resolves when logout is complete
   * @throws {Error} Logout errors
   */
  async logout(params) {
    try {
      const { refreshToken } = params;

      if (!refreshToken) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Delete the refresh token from database
      const deleted = await this.repository.deleteRefreshToken(refreshToken);
      if (!deleted) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Access token will expire naturally (15 minutes max)
    } catch (error) {
      if (error.message === 'INVALID_REFRESH_TOKEN' || error.message === 'DATABASE_CONNECTION_ERROR') {
        throw error;
      }

      console.error('Unexpected error in AuthService.logout:', error);
      throw new Error('Logout failed due to an unexpected error');
    }
  }
  /**
   * Logs out from all devices by deleting all refresh tokens for user
   * @param {Object} params - Logout parameters
   * @param {string} params.userId - User ID
   * @returns {Promise<void>}
   */
  async logoutAllDevices(params) {
    try {
      const { userId } = params;

      if (!userId) {
        throw new Error('VALIDATION_ERROR');
      }

      await this.repository.deleteAllRefreshTokensForUser(userId);
    } catch (error) {
      if (error.message === 'VALIDATION_ERROR' || error.message === 'DATABASE_CONNECTION_ERROR') {
        throw error;
      }

      console.error('Unexpected error in AuthService.logoutAllDevices:', error);
      throw new Error('Logout all devices failed');
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
      const user = await this.repository.findById(decoded.id);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Generate new tokens
      const newAccessToken = this.#generateAccessToken(user);
      const newRefreshToken = this.#generateRefreshToken();

      // Replace old refresh token with new one (rotation)
      await this.repository.replaceRefreshToken(refreshToken, {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
      };
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
