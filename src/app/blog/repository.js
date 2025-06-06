import { query } from '../../database.js';
import { validateUUID } from '../../utils/uuidUtils.js';

class BlogRepository {
  /**
   * Creates a new blog post in the database
   * @param {Object} blogData - Blog data to insert
   * @returns {Promise<Object|null>} Created blog object or null if creation failed
   * @throws {Error} Database connection errors
   */
  async create(blogData) {
    try {
      const sql = `
       INSERT INTO blogs (
         title, content, excerpt, category, tags, author, 
         featured_image_url, status, reading_time_minutes, 
         published_at, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id, title, content, excerpt, category, tags, author,
                 featured_image_url, status, reading_time_minutes, view_count,
                 published_at, created_at, updated_at;
     `;

      const params = [
        blogData.title,
        blogData.content,
        blogData.excerpt,
        blogData.category,
        blogData.tags || [],
        blogData.author,
        blogData.featured_image_url || null,
        blogData.status || 'published',
        blogData.reading_time_minutes,
        blogData.published_at || new Date(),
      ];

      const result = await query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }
      if (error.code === '23505') {
        // PostgreSQL unique violation
        throw new Error('DUPLICATE_BLOG_TITLE');
      }
      if (error.code === '23514') {
        // PostgreSQL check constraint violation
        throw new Error('INVALID_CATEGORY');
      }
      console.error('Unexpected error in BlogRepository.create:', error);
      throw error;
    }
  }

  /**
   * Finds a blog by title (case-insensitive)
   * @param {string} title - The blog title to search for
   * @returns {Promise<Object|null>} Blog object or null if not found
   * @throws {Error} Database connection errors
   */
  async findByTitle(title) {
    try {
      const sql = `
       SELECT id, title, content, excerpt, category, tags, author,
              featured_image_url, status, reading_time_minutes, view_count,
              published_at, created_at, updated_at
       FROM blogs
       WHERE LOWER(title) = LOWER($1);
     `;
      const params = [title];
      const result = await query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }
      console.error('Unexpected error in BlogRepository.findByTitle:', error);
      throw error;
    }
  }

  /**
   * Finds a blog by ID
   * @param {string} id - The blog ID to search for
   * @returns {Promise<Object|null>} Blog object or null if not found
   * @throws {Error} Database connection errors
   */
  async findById(id) {
    try {
      const validateId = validateUUID(id);
      const sql = `
       SELECT id, title, content, excerpt, category, tags, author,
              featured_image_url, status, reading_time_minutes, view_count,
              published_at, created_at, updated_at
       FROM blogs
       WHERE id = $1;
     `;
      const params = [validateId];
      const result = await query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
      }
      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }
      console.error('Unexpected error in BlogRepository.findById:', error);
      throw error;
    }
  }

  /**
   * Retrieves a paginated list of all blog posts.
   * @param {Object} options - Options for pagination and sorting.
   * @param {number} options.page - The current page number.
   * @param {number} options.limit - The number of blogs per page.
   * @param {string} options.sortOrder - The order to sort blogs ('asc' or 'desc').
   * @returns {Promise<Object>} An object containing the blogs list and pagination metadata.
   * @throws {Error} Database connection errors.
   */
  async findAll({ page = 1, limit = 10, sortOrder = 'desc' }) {
    try {
      const offset = (page - 1) * limit;
      // Ensure sortOrder is either 'asc' or 'desc' to prevent SQL injection.
      const sanitizedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Query to get the total count of blogs
      const countSql = 'SELECT COUNT(*) FROM blogs WHERE status = $1;';
      const countParams = ['published'];

      // Query to get the paginated list of blogs
      const findSql = `
        SELECT id, title, excerpt, category, tags, author,
               featured_image_url, status, reading_time_minutes, view_count,
               published_at, created_at, updated_at
        FROM blogs
        WHERE status = $1
        ORDER BY published_at ${sanitizedSortOrder}
        LIMIT $2
        OFFSET $3;
      `;
      const findParams = ['published', limit, offset];

      // Execute both queries in parallel for efficiency
      const [countResult, findResult] = await Promise.all([query(countSql, countParams), query(findSql, findParams)]);

      const totalBlogs = parseInt(countResult.rows[0].count, 10);
      const blogs = findResult.rows;

      return {
        blogs,
        pagination: {
          currentPage: page,
          limit,
          totalPages: Math.ceil(totalBlogs / limit),
          totalBlogs,
        },
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }
      console.error('Unexpected error in BlogRepository.findAll:', error);
      throw error;
    }
  }

  /**
   * Updates an existing blog post in the database.
   * @param {string} id - The ID of the blog post to update.
   * @param {Object} blogDataToUpdate - An object containing the fields to update.
   * @returns {Promise<Object|null>} The updated blog object or null if not found or update failed.
   * @throws {Error} Database connection, validation, or constraint violation errors.
   */
  async update(id, blogDataToUpdate) {
    try {
      const validatedId = validateUUID(id);

      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      // Dynamically build the SET clause and params array
      const allowedUpdateColumns = [
        'title',
        'content',
        'excerpt',
        'category',
        'tags',
        'author',
        'featured_image_url',
        'status',
        'reading_time_minutes',
        'published_at',
      ];

      for (const key of allowedUpdateColumns) {
        if (blogDataToUpdate.hasOwnProperty(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          // Handle specific data type conversions if necessary, e.g., Date for published_at
          if (key === 'published_at' && blogDataToUpdate[key] !== null) {
            params.push(blogDataToUpdate[key] instanceof Date ? blogDataToUpdate[key] : new Date(blogDataToUpdate[key]));
          } else {
            params.push(blogDataToUpdate[key]);
          }
          paramIndex++;
        }
      }

      // Always update the 'updated_at' timestamp
      updateFields.push(`updated_at = NOW()`);

      const setClause = updateFields.join(', ');

      // Add the blog ID to the parameters array for the WHERE clause
      params.push(validatedId);

      const sql = `
        UPDATE blogs
        SET ${setClause}
        WHERE id = $${paramIndex}
        RETURNING id, title, content, excerpt, category, tags, author,
                  featured_image_url, status, reading_time_minutes, view_count,
                  published_at, created_at, updated_at; 
      `;

      const result = await query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null; // null if ID not found
    } catch (error) {
      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }
      if (error.code === '23505') {
        // PostgreSQL unique violation (e.g., for title)
        if (error.constraint && error.constraint.includes('title')) {
          // Be more specific if possible
          throw new Error('DUPLICATE_BLOG_TITLE');
        }
        throw new Error('UNIQUE_CONSTRAINT_VIOLATION');
      }
      if (error.code === '23514') {
        // PostgreSQL check constraint violation (e.g., for category)
        throw new Error('INVALID_CATEGORY'); // Or a more generic CHECK_CONSTRAINT_VIOLATION
      }
      console.error('Unexpected error in BlogRepository.update:', error);
      throw error;
    }
  }

  /**
   * Deletes a blog post from the database.
   * @param {string} id - The ID of the blog post to delete.
   * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
   * @throws {Error} Database connection or validation errors.
   */
  async delete(id) {
    try {
      const validatedId = validateUUID(id);
      const sql = 'DELETE FROM blogs WHERE id = $1;';
      const params = [validatedId];

      const result = await query(sql, params);

      // The `rowCount` property indicates how many rows were affected.
      return result.rowCount > 0;
    } catch (error) {
      if (error.message === 'VALIDATION_ERROR') {
        throw error;
      }
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const dbError = new Error('DATABASE_CONNECTION_ERROR');
        dbError.originalError = error;
        throw dbError;
      }
      console.error('Unexpected error in BlogRepository.delete:', error);
      throw error;
    }
  }
}

export default BlogRepository;
