import bcrypt from 'bcryptjs';
import config from '../config/index.js';

export const hashPassword = async (password) => {
  try {
    if (!password) {
      throw new Error('Password is required for hashing');
    }

    const saltRounds = config.bcrypt?.saltRounds || 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compares a plain text password with a hashed password
 * @private
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * @throws {Error} Comparison errors
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    if (!password || !hashedPassword) {
      throw new Error('Both password and hashedPassword are required for comparison');
    }

    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw new Error('Failed to compare passwords');
  }
};
