class BlogHandler {
  constructor(blogService) {
    this.blogService = blogService;

    this.createBlog = this.createBlog.bind(this);
    this.getBlog = this.getBlog.bind(this);
    this.updateBlog = this.updateBlog.bind(this);
    this.deleteBlog = this.deleteBlog.bind(this);
    this.getListBlog = this.getListBlog.bind(this);
  }

  /**
   * Handles blog creation requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with created blog data or error
   */
  async createBlog(request, h) {
    try {
      // Extract blog data from request payload
      const blogData = request.payload || {};

      // Get user info from JWT token for audit purposes
      const userId = request.auth.credentials?.id;
      const userEmail = request.auth.credentials?.email;

      // Add metadata to blog data
      const blogPayload = {
        ...blogData,
        created_by: userId,
        author_email: userEmail,
      };

      // Call the blog service to create the blog
      const createdBlog = await this.blogService.createBlog(blogPayload);

      return h
        .response({
          status: 'success',
          message: 'Blog created successfully',
          data: {
            blog: createdBlog,
          },
        })
        .code(201);
    } catch (error) {
      if (error.message === 'DUPLICATE_BLOG_TITLE') {
        return h
          .response({
            status: 'error',
            message: 'A blog with this title already exists',
            error: 'DUPLICATE_BLOG_TITLE',
          })
          .code(409);
      }

      if (error.message === 'INVALID_CATEGORY') {
        return h
          .response({
            status: 'error',
            message: 'Invalid blog category provided',
            error: 'INVALID_CATEGORY',
          })
          .code(400);
      }

      if (error.message === 'CONTENT_TOO_LARGE') {
        return h
          .response({
            status: 'error',
            message: 'Blog content exceeds maximum allowed size',
            error: 'CONTENT_TOO_LARGE',
          })
          .code(413);
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

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        return h
          .response({
            status: 'error',
            message: 'Insufficient permissions to create blog',
            error: 'UNAUTHORIZED_ACCESS',
          })
          .code(403);
      }

      console.error('Unexpected error in createBlog handler:', error);
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
   * Handles blog retrieval requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with blog data or error
   */
  async getBlog(request, h) {
    try {
      // Extract blog ID from request parameters
      const blogId = request.params.id;

      // Call the blog service to get the blog
      const blog = await this.blogService.getBlog(blogId);

      return h
        .response({
          status: 'success',
          message: 'Blog retrieved successfully',
          data: {
            blog: blog,
          },
        })
        .code(200);
    } catch (error) {
      if (error.message === 'BLOG_NOT_FOUND' || error.message === 'VALIDATION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Blog not found',
            error: 'BLOG_NOT_FOUND',
          })
          .code(404);
      }

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        return h
          .response({
            status: 'error',
            message: 'Insufficient permissions to view this blog',
            error: 'UNAUTHORIZED_ACCESS',
          })
          .code(403);
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

      console.error('Unexpected error in getBlog handler:', error);
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
   * Handles blog update requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with updated blog data or error
   */
  async updateBlog(request, h) {
    try {
      // Extract blog ID from request parameters
      const blogId = request.params.id;
      const blogDataToUpdate = request.payload || {};

      // Get user info from JWT token for audit purposes
      const userId = request.auth.credentials?.id;

      // Prepare the payload for the service layer, adding who is updating
      const updatePayload = {
        ...blogDataToUpdate,
        updated_by: userId, // Add user ID for tracking who made the update
      };

      const updatedBlog = await this.blogService.updateBlog(blogId, updatePayload);

      return h
        .response({
          status: 'success',
          message: 'Blog updated successfully',
          data: {
            blog: updatedBlog,
          },
        })
        .code(200);
    } catch (error) {
      if (error.message === 'BLOG_NOT_FOUND' || error.message === 'VALIDATION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Blog not found or you do not have permission to update it.',
            error: 'BLOG_NOT_FOUND',
          })
          .code(404);
      }

      if (error.message === 'DUPLICATE_BLOG_TITLE') {
        return h
          .response({
            status: 'error',
            message: 'A blog with this title already exists. Please choose a different title.',
            error: 'DUPLICATE_BLOG_TITLE',
          })
          .code(409); // Conflict
      }

      if (error.message === 'INVALID_CATEGORY') {
        return h
          .response({
            status: 'error',
            message: 'Invalid blog category provided for update.',
            error: 'INVALID_CATEGORY',
          })
          .code(400);
      }

      if (error.message === 'CONTENT_TOO_LARGE') {
        return h
          .response({
            status: 'error',
            message: 'Updated blog content exceeds maximum allowed size.',
            error: 'CONTENT_TOO_LARGE',
          })
          .code(413);
      }

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        return h
          .response({
            status: 'error',
            message: 'Insufficient permissions to update this blog.',
            error: 'UNAUTHORIZED_ACCESS',
          })
          .code(403);
      }

      if (error.message === 'DATABASE_CONNECTION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Service temporarily unavailable. Please try again later.',
            error: 'SERVICE_UNAVAILABLE',
          })
          .code(503);
      }

      // Generic error for unexpected issues
      console.error('Unexpected error in updateBlog handler:', error);
      return h
        .response({
          status: 'error',
          message: 'An unexpected error occurred while updating the blog.',
          error: 'INTERNAL_SERVER_ERROR',
        })
        .code(500);
    }
  }

  /**
   * Handles blog deletion requests
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response confirming deletion or an error
   */
  async deleteBlog(request, h) {
    try {
      const blogId = request.params.id;

      await this.blogService.deleteBlog(blogId);

      return h
        .response({
          status: 'success',
          message: 'Blog deleted successfully',
        })
        .code(200);
    } catch (error) {
      if (error.message === 'BLOG_NOT_FOUND' || error.message === 'VALIDATION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Blog not found',
            error: 'BLOG_NOT_FOUND',
          })
          .code(404);
      }

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        return h
          .response({
            status: 'error',
            message: 'Insufficient permissions to delete this blog.',
            error: 'UNAUTHORIZED_ACCESS',
          })
          .code(403);
      }

      if (error.message === 'DATABASE_CONNECTION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Service temporarily unavailable.',
            error: 'SERVICE_UNAVAILABLE',
          })
          .code(503);
      }

      console.error('Unexpected error in deleteBlog handler:', error);
      return h
        .response({
          status: 'error',
          message: 'An unexpected error occurred while deleting the blog.',
          error: 'INTERNAL_SERVER_ERROR',
        })
        .code(500);
    }
  }

  /**
   * Handles retrieving a list of blogs with pagination.
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} HTTP response with a list of blogs and pagination details or an error.
   */
  async getListBlog(request, h) {
    try {
      const queryOptions = request.query;
      const result = await this.blogService.getListBlog(queryOptions);

      return h
        .response({
          status: 'success',
          message: 'Blogs retrieved successfully',
          data: result,
        })
        .code(200);
    } catch (error) {
      if (error.message === 'DATABASE_CONNECTION_ERROR') {
        return h
          .response({
            status: 'error',
            message: 'Service temporarily unavailable.',
            error: 'SERVICE_UNAVAILABLE',
          })
          .code(503);
      }

      console.error('Unexpected error in getListBlog handler:', error);
      return h
        .response({
          status: 'error',
          message: 'An unexpected error occurred while retrieving blogs.',
          error: 'INTERNAL_SERVER_ERROR',
        })
        .code(500);
    }
  }
}

export default BlogHandler;
