class BlogService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Calculate estimated reading time based on content length
   * @param {string} content - Blog content
   * @returns {number} Estimated reading time in minutes
   * @private
   */
  _calculateReadingTime(content) {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Generate excerpt from blog content
   * @param {string} content - Blog content
   * @returns {string} Generated excerpt
   * @private
   */
  _generateExcerpt(content) {
    const maxLength = 200;
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();

    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }

    // Find the last complete sentence within the limit
    const truncated = cleanContent.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastQuestion = truncated.lastIndexOf('?');

    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

    if (lastSentenceEnd > maxLength * 0.7) {
      // If we found a sentence end reasonably close to the limit
      return cleanContent.substring(0, lastSentenceEnd + 1);
    }

    // Otherwise, truncate at word boundary and add ellipsis
    const lastSpace = truncated.lastIndexOf(' ');
    return cleanContent.substring(0, lastSpace) + '...';
  }

  /**
   * Handles blog creation with validation and business logic
   * @param {Object} blogData - Blog creation data
   * @param {string} blogData.title - Blog title
   * @param {string} blogData.content - Blog content
   * @param {string} blogData.category - Blog category
   * @param {string} blogData.author - Blog author
   * @param {string} [blogData.excerpt] - Blog excerpt
   * @param {Array} [blogData.tags] - Blog tags
   * @param {string} [blogData.featured_image_url] - Featured image URL
   * @param {string} [blogData.status] - Blog status (draft/published/archived)
   * @param {number} [blogData.reading_time_minutes] - Estimated reading time
   * @param {Date} [blogData.published_at] - Publication date
   * @param {string} [blogData.author_email] - Author email for audit
   * @returns {Promise<Object>} Promise that resolves with created blog data
   * @throws {Error} Blog creation errors
   */
  async createBlog(blogData) {
    try {
      // Validate required fields
      if (!blogData.title || !blogData.content || !blogData.category || !blogData.author) {
        throw new Error('MISSING_REQUIRED_FIELDS');
      }

      // Check for duplicate title
      const existingBlog = await this.repository.findByTitle(blogData.title.trim());
      if (existingBlog) {
        throw new Error('DUPLICATE_BLOG_TITLE');
      }

      // Validate category
      const validCategories = ['diabetes', 'nutrition', 'lifestyle', 'exercise', 'mental-health'];
      if (!validCategories.includes(blogData.category)) {
        throw new Error('INVALID_CATEGORY');
      }

      // Calculate reading time if not provided
      if (!blogData.reading_time_minutes) {
        blogData.reading_time_minutes = this._calculateReadingTime(blogData.content);
      }

      // Generate excerpt if not provided
      if (!blogData.excerpt) {
        blogData.excerpt = this._generateExcerpt(blogData.content);
      }

      // Set default status if not provided
      if (!blogData.status) {
        blogData.status = 'published';
      }

      // Set published_at to now if status is published and no date provided
      if (blogData.status === 'published' && !blogData.published_at) {
        blogData.published_at = new Date();
      }

      // Clean and validate tags
      if (blogData.tags && Array.isArray(blogData.tags)) {
        blogData.tags = blogData.tags
          .filter((tag) => tag && typeof tag === 'string')
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0)
          .slice(0, 10); // Limit to 10 tags
      }

      // Create the blog in database
      const createdBlog = await this.repository.create(blogData);

      if (!createdBlog) {
        throw new Error('BLOG_CREATION_FAILED');
      }

      return createdBlog;
    } catch (error) {
      if (
        error.message === 'DUPLICATE_BLOG_TITLE' ||
        error.message === 'INVALID_CATEGORY' ||
        error.message === 'MISSING_REQUIRED_FIELDS' ||
        error.message === 'CONTENT_TOO_LARGE' ||
        error.message === 'DATABASE_CONNECTION_ERROR' ||
        error.message === 'UNAUTHORIZED_ACCESS'
      ) {
        throw error;
      }

      console.error('Unexpected error in BlogService.createBlog:', error);
      throw new Error('Blog creation failed due to an unexpected error');
    }
  }

  /**
   * Handles blog retrieval with access control and business logic
   * @param {string} blogId - Blog ID to retrieve
   * @param {string} [userId] - User ID for access control (optional for public access)
   * @param {string} [userRole] - User role for access control (optional for public access)
   * @returns {Promise<Object>} Promise that resolves with blog data
   * @throws {Error} Blog retrieval errors
   */
  async getBlog(blogId) {
    try {
      // Validate blog ID format
      if (!blogId || typeof blogId !== 'string' || blogId.trim().length === 0) {
        throw new Error('BLOG_NOT_FOUND');
      }

      // Find the blog by ID
      const blog = await this.repository.findById(blogId.trim());

      if (!blog) {
        throw new Error('BLOG_NOT_FOUND');
      }

      return blog;
    } catch (error) {
      if (
        error.message === 'BLOG_NOT_FOUND' ||
        error.message === 'UNAUTHORIZED_ACCESS' ||
        error.message === 'DATABASE_CONNECTION_ERROR' ||
        error.message === 'VALIDATION_ERROR'
      ) {
        throw error;
      }

      console.error('Unexpected error in BlogService.getBlog:', error);
      throw new Error('Blog retrieval failed due to an unexpected error');
    }
  }

  /**
   * Handles blog update with validation and business logic.
   * @param {string} blogId - The ID of the blog to update.
   * @param {Object} blogDataToUpdate - Data to update the blog with.
   * @param {string} [blogDataToUpdate.title] - New blog title.
   * @param {string} [blogDataToUpdate.content] - New blog content.
   * @param {string} [blogDataToUpdate.category] - New blog category.
   * @param {string} [blogDataToUpdate.author] - New blog author.
   * @param {string} [blogDataToUpdate.excerpt] - New blog excerpt.
   * @param {Array<string>} [blogDataToUpdate.tags] - New blog tags.
   * @param {string} [blogDataToUpdate.featured_image_url] - New featured image URL.
   * @param {string} [blogDataToUpdate.status] - New blog status.
   * @param {number} [blogDataToUpdate.reading_time_minutes] - New estimated reading time.
   * @param {Date|string} [blogDataToUpdate.published_at] - New publication date.
   * @returns {Promise<Object>} Promise that resolves with the updated blog data.
   * @throws {Error} Blog update errors (e.g., BLOG_NOT_FOUND, DUPLICATE_BLOG_TITLE).
   */
  async updateBlog(blogId, blogDataToUpdate) {
    try {
      if (!blogId || typeof blogId !== 'string' || blogId.trim().length === 0) {
        throw new Error('BLOG_NOT_FOUND'); // Or INVALID_BLOG_ID
      }

      // Check if there's anything to update.
      // If blogDataToUpdate is empty, no actual update is requested from the user.
      if (Object.keys(blogDataToUpdate).length === 0) {
        // Fetch and return the existing blog as no changes were requested.
        const existingBlogUnchanged = await this.repository.findById(blogId.trim());
        if (!existingBlogUnchanged) {
          throw new Error('BLOG_NOT_FOUND');
        }
        return existingBlogUnchanged;
      }

      // Fetch the existing blog
      const existingBlog = await this.repository.findById(blogId.trim());
      if (!existingBlog) {
        throw new Error('BLOG_NOT_FOUND');
      }

      // Prepare payload for update, starting with the fields sent for update
      const payloadToUpdate = { ...blogDataToUpdate };

      // If title is being updated, check for duplicates (excluding the current blog)
      if (payloadToUpdate.title && payloadToUpdate.title.trim() !== existingBlog.title) {
        const otherBlogWithSameTitle = await this.repository.findByTitle(payloadToUpdate.title.trim());
        if (otherBlogWithSameTitle && otherBlogWithSameTitle.id !== blogId) {
          throw new Error('DUPLICATE_BLOG_TITLE');
        }
      }

      // Validate category if provided
      if (payloadToUpdate.category) {
        const validCategories = ['diabetes', 'nutrition', 'lifestyle', 'exercise', 'mental-health'];
        if (!validCategories.includes(payloadToUpdate.category)) {
          throw new Error('INVALID_CATEGORY');
        }
      }

      // Determine the content to use for recalculating dependent fields
      const newContent = payloadToUpdate.content !== undefined ? payloadToUpdate.content : existingBlog.content;

      // If content is updated AND reading_time is not explicitly set in the update, recalculate it
      if (payloadToUpdate.content !== undefined && payloadToUpdate.reading_time_minutes === undefined) {
        payloadToUpdate.reading_time_minutes = this._calculateReadingTime(newContent);
      }

      // If content is updated AND excerpt is not explicitly set in the update, regenerate it
      if (payloadToUpdate.content !== undefined && payloadToUpdate.excerpt === undefined) {
        payloadToUpdate.excerpt = this._generateExcerpt(newContent);
      }

      // Handle status and published_at logic
      const newStatus = payloadToUpdate.status !== undefined ? payloadToUpdate.status : existingBlog.status;

      if (newStatus === 'published') {
        if (payloadToUpdate.published_at) {
          // If published_at is explicitly provided in update
          payloadToUpdate.published_at = new Date(payloadToUpdate.published_at);
        } else if (!existingBlog.published_at) {
          // If blog was not previously published (e.g., draft)
          payloadToUpdate.published_at = new Date(); // Set to now
        }
        // If already published and no new published_at is given, existingBlog.published_at will be used by repository merge logic
      } else if (newStatus !== 'published' && payloadToUpdate.published_at === undefined) {
        // If moving to a non-published status and published_at is not explicitly being set in the payload,
        // set it to null to clear it.
        payloadToUpdate.published_at = null;
      }

      // Clean and validate tags if provided
      if (payloadToUpdate.tags && Array.isArray(payloadToUpdate.tags)) {
        payloadToUpdate.tags = payloadToUpdate.tags
          .filter((tag) => tag && typeof tag === 'string')
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0)
          .slice(0, 10);
      }

      // Call repository to update.
      const updatedBlog = await this.repository.update(blogId.trim(), payloadToUpdate);
      if (!updatedBlog) {
        // This might occur if the update operation in the repository fails silently
        // or if the repository returns null/undefined for a failed update that didn't throw.
        throw new Error('BLOG_UPDATE_FAILED');
      }

      return updatedBlog;
    } catch (error) {
      if (
        [
          'BLOG_NOT_FOUND',
          'DUPLICATE_BLOG_TITLE',
          'INVALID_CATEGORY',
          'CONTENT_TOO_LARGE',
          'DATABASE_CONNECTION_ERROR',
          'UNAUTHORIZED_ACCESS',
          'BLOG_UPDATE_FAILED',
          'VALIDATION_ERROR',
        ].includes(error.message)
      ) {
        throw error;
      }
      console.error('Unexpected error in BlogService.updateBlog:', error.message, error.stack);
      throw new Error('SERVICE_ERROR_UPDATE_BLOG'); // Generic service error
    }
  }

  /**
   * Handles blog deletion.
   * @param {string} blogId - The ID of the blog to delete.
   * @returns {Promise<{success: boolean, message: string}>} A confirmation object.
   * @throws {Error} Blog deletion errors (e.g., BLOG_NOT_FOUND).
   */
  async deleteBlog(blogId) {
    try {
      if (!blogId || typeof blogId !== 'string' || blogId.trim().length === 0) {
        throw new Error('BLOG_NOT_FOUND');
      }

      // First, check if the blog exists to provide a clear error.
      const existingBlog = await this.repository.findById(blogId.trim());
      if (!existingBlog) {
        throw new Error('BLOG_NOT_FOUND');
      }

      // Call the repository to delete the blog.
      const deletionResult = await this.repository.delete(blogId.trim());

      // The repository's delete method should ideally return a boolean or the number of rows affected.
      if (!deletionResult) {
        throw new Error('BLOG_DELETION_FAILED');
      }

      return { success: true, message: 'Blog deleted successfully.' };
    } catch (error) {
      // Re-throw specific, known errors for the handler to process.
      if (
        ['BLOG_NOT_FOUND', 'VALIDATION_ERROR', 'DATABASE_CONNECTION_ERROR', 'UNAUTHORIZED_ACCESS', 'BLOG_DELETION_FAILED'].includes(error.message)
      ) {
        throw error;
      }

      // Log and throw a generic error for unexpected issues.
      console.error('Unexpected error in BlogService.deleteBlog:', error);
      throw new Error('SERVICE_ERROR_DELETE_BLOG');
    }
  }

  /**
   * Retrieves a paginated list of blogs.
   * @param {Object} options - Options for pagination and sorting.
   * @param {number} options.page - The current page number.
   * @param {number} options.limit - The number of blogs per page.
   * @param {string} options.sortOrder - The order to sort blogs ('asc' or 'desc').
   * @returns {Promise<Object>} A promise that resolves to an object containing the blogs and pagination metadata.
   * @throws {Error} Throws an error if the operation fails.
   */
  async getListBlog(options) {
    try {
      const result = await this.repository.findAll(options);
      return result;
    } catch (error) {
      if (['DATABASE_CONNECTION_ERROR'].includes(error.message)) {
        throw error;
      }
      console.error('Unexpected error in BlogService.getListBlog:', error);
      throw new Error('SERVICE_ERROR_GET_LIST_BLOG');
    }
  }
}

export default BlogService;
