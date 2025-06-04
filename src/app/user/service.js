import { hashPassword } from '../../utils/passwordUtils.js';

class UserService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Retrieves user profile data by user ID
   * @param {string|number} userId - The user ID
   * @returns {Promise<Object>} User profile data without sensitive information
   * @throws {Error} User retrieval errors
   */
  async getUserProfile(userId) {
    try {
      // Validate input parameters
      if (!userId) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'User ID is required';
        throw error;
      }

      // Find user by ID
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Remove sensitive information from user object
      const { password_hash, ...userProfile } = user;

      return userProfile;
    } catch (error) {
      // Re-throw known errors
      if (error.message === 'VALIDATION_ERROR' || error.message === 'USER_NOT_FOUND' || error.message === 'DATABASE_CONNECTION_ERROR') {
        throw error;
      }

      // Log unexpected errors
      console.error('Unexpected error in AuthService.getUserProfile:', error);
      throw new Error('Failed to retrieve user profile due to an unexpected error');
    }
  }

  /**
   * Updates user profile data by user ID
   * @param {string|number} userId - The user ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} Updated user profile data without sensitive information
   * @throws {Error} User update errors
   */
  async updateUserProfile(userId, updateData) {
    try {
      // Validate input parameters
      if (!userId) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'User ID is required';
        throw error;
      }

      if (!updateData || typeof updateData !== 'object') {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Update data is required and must be an object';
        throw error;
      }

      // Validate that updateData is not empty
      if (Object.keys(updateData).length === 0) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'At least one field must be provided for update';
        throw error;
      }

      // Remove sensitive fields that shouldn't be updated directly
      const { password_hash, id, created_at, ...allowedUpdates } = updateData;

      if (Object.keys(allowedUpdates).length === 0) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'No valid fields provided for update';
        throw error;
      }

      // Find user by ID
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Update user profile
      const updatedUser = await this.repository.update(userId, allowedUpdates);

      if (!updatedUser) {
        throw new Error('UPDATE_FAILED');
      }

      // Remove sensitive information from updated user object
      const { password_hash: _, ...userProfile } = updatedUser;

      return userProfile;
    } catch (error) {
      // Re-throw known errors
      if (
        error.message === 'VALIDATION_ERROR' ||
        error.message === 'USER_NOT_FOUND' ||
        error.message === 'UPDATE_FAILED' ||
        error.message === 'DATABASE_CONNECTION_ERROR'
      ) {
        throw error;
      }

      // Log unexpected errors
      console.error('Unexpected error in AuthService.updateUserProfile:', error);
      throw new Error('Failed to update user profile due to an unexpected error');
    }
  }

  /**
   * Changes user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current plain text password
   * @param {string} newPassword - New plain text password
   * @returns {Promise<Object>} Updated user object without password
   * @throws {Error} Password change errors including validation and database errors
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Validate input parameters
      if (!userId) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'User ID is required';
        throw error;
      }

      if (!currentPassword) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'Current password is required';
        throw error;
      }

      if (!newPassword) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'New password is required';
        throw error;
      }

      // Additional business logic validations
      if (newPassword.length < 8) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'New password must be at least 8 characters long';
        throw error;
      }

      // Check if new password is the same as current password
      if (currentPassword === newPassword) {
        const error = new Error('VALIDATION_ERROR');
        error.details = 'New password must be different from current password';
        throw error;
      }

      // Find user by ID with password hash for verification
      const userWithPassword = await this.repository.findByIdWithPassword(userId);
      if (!userWithPassword) {
        const error = new Error('USER_NOT_FOUND');
        error.details = 'User not found';
        throw error;
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, userWithPassword.password_hash);
      if (!isCurrentPasswordValid) {
        const error = new Error('INVALID_CURRENT_PASSWORD');
        error.details = 'Current password is incorrect';
        throw error;
      }

      // Hash the new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update the password
      const updatedUser = await this.repository.updatePassword(userId, hashedNewPassword);

      if (!updatedUser) {
        const error = new Error('USER_NOT_FOUND');
        error.details = 'User not found during password update';
        throw error;
      }

      return updatedUser;
    } catch (error) {
      // Re-throw known errors
      if (
        error.message === 'VALIDATION_ERROR' ||
        error.message === 'USER_NOT_FOUND' ||
        error.message === 'INVALID_CURRENT_PASSWORD' ||
        error.message === 'DATABASE_CONNECTION_ERROR'
      ) {
        throw error;
      }

      // Log and re-throw database constraint errors
      if (error.code && error.code.startsWith('23')) {
        console.error('Database constraint error in changePassword:', error);
        throw error;
      }

      // Log unexpected errors
      console.error('Unexpected error in AuthService.changePassword:', error);
      throw new Error('Password change failed due to an unexpected error');
    }
  }
}

export default UserService;
