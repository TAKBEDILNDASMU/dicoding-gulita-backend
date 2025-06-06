'use strict';

import Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../../src/server.js';
import { clearTestData, createTestBlogInDB, createTestBlogsForPagination } from '../helpers/db-helpers.js';
import { getAuthToken } from '../helpers/test-helpers.js';

export const lab = Lab.script();
const { before, after, describe, it } = lab;

describe('Blog Routes', () => {
  let server;
  let authToken;

  before(async () => {
    server = await init();
    await clearTestData();
    authToken = await getAuthToken(server);
  });

  after(async () => {
    await server.stop();
    await clearTestData();
  });

  describe('POST /api/v1/blogs', () => {
    it('should create a new blog post with valid data and token', async () => {
      await clearTestData();

      const blogData = {
        title: 'Test Blog Post',
        content:
          'This is a test blog post content for testing purposes. It contains detailed information about diabetes management and lifestyle tips.',
        excerpt: 'A comprehensive guide to diabetes management',
        tags: ['diabetes', 'health', 'lifestyle'],
        category: 'diabetes',
        author: 'Test Author',
        featured_image_url: 'https://example.com/test-image.jpg',
        status: 'published',
        reading_time_minutes: 5,
      };

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/blogs',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: blogData,
      });

      expect(res.statusCode).to.equal(201);
      expect(res.result.message).to.equal('Blog created successfully');
      expect(res.result.data.blog.title).to.equal(blogData.title);
      expect(res.result.data.blog.content).to.equal(blogData.content);
      expect(res.result.data.blog.tags).to.equal(blogData.tags);
      expect(res.result.data.blog.category).to.equal(blogData.category);
      expect(res.result.data.blog.id).to.exist();
    });

    it('should reject blog creation without authorization token', async () => {
      const blogData = {
        title: 'Unauthorized Blog Post',
        content: 'This should not be created without auth.',
      };

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/blogs',
        // No headers provided
        payload: blogData,
      });

      expect(res.statusCode).to.equal(401);
    });

    it('should reject blog creation with invalid token', async () => {
      const blogData = {
        title: 'Invalid Token Blog Post',
        content: 'This should not be created with invalid token.',
      };

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/blogs',
        headers: {
          Authorization: 'Bearer invalidtoken12345',
        },
        payload: blogData,
      });

      expect(res.statusCode).to.equal(401);
    });

    it('should reject blog creation with missing required fields', async () => {
      const invalidBlogData = {
        tags: ['incomplete'],
      };

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/blogs',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: invalidBlogData,
      });

      expect(res.statusCode).to.equal(400);
    });

    it('should reject blog creation with empty title', async () => {
      const invalidBlogData = {
        title: '',
        content: 'This has empty title',
      };

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/blogs',
        headers: {
          Authorization: `Bearer ${authToken.accessToken}`,
        },
        payload: invalidBlogData,
      });

      expect(res.statusCode).to.equal(400);
    });
  });

  describe('GET /api/v1/blogs/{id}', () => {
    it('should retrieve a published blog post with valid ID', async () => {
      await clearTestData();
      const createdBlog = await createTestBlogInDB();

      const res = await server.inject({
        method: 'GET',
        url: `/api/v1/blogs/${createdBlog.id}`,
      });

      expect(res.statusCode).to.equal(200);
      expect(res.result.message).to.equal('Blog retrieved successfully');
    });
  });

  it('should return 404 for non-existent blog ID', async () => {
    const nonExistentId = '3d57870f-ba05-49a2-b2fc-471344191341';

    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/blogs/${nonExistentId}`,
    });

    expect(res.statusCode).to.equal(404);
    expect(res.result.status).to.equal('error');
    expect(res.result.message).to.equal('Blog not found');
    expect(res.result.error).to.equal('BLOG_NOT_FOUND');
  });

  it('should return 404 for invalid blog ID format', async () => {
    const invalidId = 'invalid-id-format';

    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/blogs/${invalidId}`,
    });

    expect(res.statusCode).to.equal(404);
    expect(res.result.status).to.equal('error');
    expect(res.result.message).to.equal('Blog not found');
    expect(res.result.error).to.equal('BLOG_NOT_FOUND');
  });

  describe('PUT /api/v1/blogs/{id}', () => {
    it('should update an existing blog post with valid data and token', async () => {
      await clearTestData();
      const createdBlog = await createTestBlogInDB({
        title: 'Initial Test Blog Post',
        content: 'This is the initial content for testing PUT.',
      });

      const updateData = {
        title: 'Updated Test Blog Title',
        content: 'This content has been updated for the test.',
        category: 'lifestyle',
        tags: ['updated', 'testing'],
      };

      const res = await server.inject({
        method: 'PUT',
        url: `/api/v1/blogs/${createdBlog.id}`,
        headers: { Authorization: `Bearer ${authToken.accessToken}` },
        payload: updateData,
      });

      expect(res.statusCode).to.equal(200);
      expect(res.result.message).to.equal('Blog updated successfully');
      expect(res.result.data.blog.title).to.equal(updateData.title);
      expect(res.result.data.blog.content).to.equal(updateData.content);
      expect(res.result.data.blog.category).to.equal(updateData.category);
      expect(res.result.data.blog.tags).to.equal(updateData.tags);
    });

    it('should return 404 when trying to update a non-existent blog ID', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID, but non-existent
      const updateData = { title: 'Title for Non-existent Blog' };

      const res = await server.inject({
        method: 'PUT',
        url: `/api/v1/blogs/${nonExistentId}`,
        headers: { Authorization: `Bearer ${authToken.accessToken}` },
        payload: updateData,
      });

      expect(res.statusCode).to.equal(404);
      expect(res.result.error).to.equal('BLOG_NOT_FOUND');
    });

    it('should return 400 for invalid blog ID format on update (Joi validation)', async () => {
      const invalidId = 'not-a-uuid';
      const updateData = { title: 'Title for Invalid ID Blog' };

      const res = await server.inject({
        method: 'PUT',
        url: `/api/v1/blogs/${invalidId}`,
        headers: { Authorization: `Bearer ${authToken.accessToken}` },
        payload: updateData,
      });

      expect(res.statusCode).to.equal(404);
      expect(res.result.error).to.equal('BLOG_NOT_FOUND');
    });

    it('should reject update without authorization token', async () => {
      await clearTestData();
      const createdBlog = await createTestBlogInDB();
      const updateData = { title: 'Update without Auth Attempt' };

      const res = await server.inject({
        method: 'PUT',
        url: `/api/v1/blogs/${createdBlog.id}`,
        payload: updateData,
      });
      expect(res.statusCode).to.equal(401);
    });

    it('should reject update with invalid token', async () => {
      await clearTestData();
      const createdBlog = await createTestBlogInDB();
      const updateData = { title: 'Update with Invalid Token Attempt' };
      const res = await server.inject({
        method: 'PUT',
        url: `/api/v1/blogs/${createdBlog.id}`,
        headers: { Authorization: 'Bearer aninvalidtoken' },
        payload: updateData,
      });
      expect(res.statusCode).to.equal(401);
    });

    it('should reject update with invalid payload data (e.g., title too short)', async () => {
      await clearTestData();
      const createdBlog = await createTestBlogInDB();
      const invalidUpdateData = { title: 'S' }; // Title too short

      const res = await server.inject({
        method: 'PUT',
        url: `/api/v1/blogs/${createdBlog.id}`,
        headers: { Authorization: `Bearer ${authToken.accessToken}` },
        payload: invalidUpdateData,
      });
      expect(res.statusCode).to.equal(400);
      expect(res.result.error).to.equal('VALIDATION_ERROR');
      const titleError = res.result.details.find((d) => d.field === 'title');
      expect(titleError).to.exist();
      expect(titleError.message).to.include('"title" must be at least 3 characters long');
    });

    it('should reject update if title duplicates another existing blog post', async () => {
      const firstBlog = await createTestBlogInDB({
        title: 'First Test Blog Post',
        content: 'Content for first blog.',
      });
      const secondBlog = await createTestBlogInDB({
        title: 'Second Test Blog Post',
        content: 'Content for second blog.',
      });

      const updateData = { title: secondBlog.title };

      const res = await server.inject({
        method: 'PUT',
        url: `/api/v1/blogs/${firstBlog.id}`,
        headers: { Authorization: `Bearer ${authToken.accessToken}` },
        payload: updateData,
      });

      expect(res.statusCode).to.equal(409); // Conflict
      expect(res.result.error).to.equal('DUPLICATE_BLOG_TITLE');
    });

    it('should allow updating only specific fields (partial update)', async () => {
      await clearTestData();
      const createdBlog = await createTestBlogInDB();

      const partialUpdateData = {
        status: 'draft',
        reading_time_minutes: 15,
      };

      const res = await server.inject({
        method: 'PUT',
        url: `/api/v1/blogs/${createdBlog.id}`,
        headers: { Authorization: `Bearer ${authToken.accessToken}` },
        payload: partialUpdateData,
      });

      expect(res.statusCode).to.equal(200);
      expect(res.result.data.blog.status).to.equal(partialUpdateData.status);
      expect(res.result.data.blog.reading_time_minutes).to.equal(partialUpdateData.reading_time_minutes);
      expect(res.result.data.blog.title).to.equal('Test Blog Post Title');
    });
  });

  describe('DELETE /api/v1/blogs/{id}', () => {
    it('should delete an existing blog post with a valid token', async () => {
      await clearTestData();
      const createdBlog = await createTestBlogInDB();

      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/blogs/${createdBlog.id}`,
        headers: { Authorization: `Bearer ${authToken.accessToken}` },
      });

      expect(res.statusCode).to.equal(200);
      expect(res.result.status).to.equal('success');
      expect(res.result.message).to.equal('Blog deleted successfully');

      // Verify the blog is actually gone
      const getRes = await server.inject({
        method: 'GET',
        url: `/api/v1/blogs/${createdBlog.id}`,
      });
      expect(getRes.statusCode).to.equal(404);
    });

    it('should return 404 when trying to delete a non-existent blog ID', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID, but non-existent
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/blogs/${nonExistentId}`,
        headers: { Authorization: `Bearer ${authToken.accessToken}` },
      });

      expect(res.statusCode).to.equal(404);
      expect(res.result.error).to.equal('BLOG_NOT_FOUND');
    });

    it('should return 404 for invalid blog ID format on delete', async () => {
      const invalidId = 'not-a-uuid';
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/blogs/${invalidId}`,
        headers: { Authorization: `Bearer ${authToken.accessToken}` },
      });

      expect(res.statusCode).to.equal(404);
      expect(res.result.error).to.equal('BLOG_NOT_FOUND');
    });

    it('should reject deletion without an authorization token', async () => {
      await clearTestData();
      const createdBlog = await createTestBlogInDB();

      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/blogs/${createdBlog.id}`,
        // No auth header
      });
      expect(res.statusCode).to.equal(401);
    });

    it('should reject deletion with an invalid token', async () => {
      await clearTestData();
      const createdBlog = await createTestBlogInDB();

      const res = await server.inject({
        method: 'DELETE',
        url: `/api/v1/blogs/${createdBlog.id}`,
        headers: { Authorization: 'Bearer aninvalidtoken' },
      });
      expect(res.statusCode).to.equal(401);
    });
  });

  describe('GET /api/v1/blogs (List)', () => {
    it('should retrieve a paginated list of blogs with default settings', async () => {
      await clearTestData();
      await createTestBlogsForPagination();

      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/blogs',
      });

      expect(res.statusCode).to.equal(200);
      expect(res.result.status).to.equal('success');
      expect(res.result.data.blogs).to.be.an.array();
      expect(res.result.data.blogs.length).to.be.at.most(10);
      expect(res.result.data.pagination).to.exist();
      expect(res.result.data.pagination.totalBlogs).to.equal(25);
      expect(res.result.data.pagination.currentPage).to.equal(1);
    });

    it('should respect the "limit" query parameter', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/blogs?limit=2',
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.blogs).to.be.an.array();
      expect(res.result.data.blogs.length).to.equal(2);
      expect(res.result.data.pagination.limit).to.equal(2);
      expect(res.result.data.pagination.totalPages).to.equal(13); // 25 blogs, 2 per page = 13 pages
    });

    it('should respect the "page" and "limit" query parameters', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/blogs?limit=2&page=13',
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.blogs).to.be.an.array();
      expect(res.result.data.blogs.length).to.equal(1); // Page 13 should have the last remaining blog
      expect(res.result.data.pagination.currentPage).to.equal(13);
    });

    it('should sort blogs in descending order by default (newest first)', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/blogs',
      });
      const blogs = res.result.data.blogs;
      const firstBlogDate = new Date(blogs[0].published_at);
      const secondBlogDate = new Date(blogs[1].published_at);
      expect(firstBlogDate.getTime()).to.be.greaterThan(secondBlogDate.getTime());
    });

    it('should sort blogs in ascending order when specified', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/blogs?sortOrder=asc',
      });
      const blogs = res.result.data.blogs;
      const firstBlogDate = new Date(blogs[0].published_at);
      const secondBlogDate = new Date(blogs[1].published_at);
      expect(firstBlogDate.getTime()).to.be.lessThan(secondBlogDate.getTime());
    });

    it('should return 400 for invalid query parameters', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/v1/blogs?page=-1', // Invalid page number
      });
      expect(res.statusCode).to.equal(400);
      expect(res.result.error).to.equal('VALIDATION_ERROR');
    });
  });
});
