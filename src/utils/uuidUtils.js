/**
 * UUID utility functions
 */

/**
 * Validates if a string is a valid UUID format
 * @param {string} uuid - The UUID string to validate
 * @returns {boolean} True if valid UUID format, false otherwise
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates and sanitizes a UUID input
 * @param {any} id - The ID to validate
 * @returns {string} The validated UUID
 * @throws {Error} If the UUID is invalid
 */
export function validateUUID(id) {
  if (!isValidUUID(id)) {
    const error = new Error('VALIDATION_ERROR');
    error.details = 'Valid user ID (UUID) is required';
    throw error;
  }
  return id.toLowerCase(); // Normalize to lowercase
}
