'use strict';

import pool from '../../src/database.js';

// Helper to clear test data from database
export const clearTestData = async () => {
  try {
    // Clear test data - be careful with this in production!

    // Delete test blog posts (based on test patterns in title or author)
    await pool.query('DELETE FROM blogs WHERE title LIKE $1', ['%Test%']);
    await pool.query('DELETE FROM blogs WHERE title LIKE $1', ['%test%']);
    await pool.query('DELETE FROM blogs WHERE author LIKE $1', ['Test%']);
    await pool.query('DELETE FROM blogs WHERE author LIKE $1', ['testuser_%']);

    // Delete the test users
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test_%@example.com']);
    await pool.query('DELETE FROM users WHERE username LIKE $1', ['testuser_%']);
    await pool.query('DELETE FROM users WHERE username LIKE $1', ['user_%']);
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    throw error;
  }
};

// Helper to create test user directly in database
export const createTestUserInDB = async () => {
  // Predefined test user data
  const testUserData = {
    username: 'testuserJohnDoe',
    email: 'testJohnDoe@example.com',
    passwordHash: 'testpasswordhash123',
  };

  const query = `
    INSERT INTO users (username, email, password_hash, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, username, email, created_at
  `;

  try {
    const result = await pool.query(query, [testUserData.username, testUserData.email, testUserData.passwordHash]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error creating test user in DB:', error);
    throw error;
  }
};

// Helper to check if user exists in database
export const userExistsInDB = async (identifier) => {
  const query = `
    SELECT id, username, email
    FROM users
    WHERE username = $1 OR email = $1
  `;

  try {
    const result = await pool.query(query, [identifier]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('❌ Error checking user existence:', error);
    throw error;
  }
};

// Helper to create test blog post directly in database
export const createTestBlogInDB = async (blogData = {}) => {
  // Predefined test blog data
  const testBlogData = {
    title: 'Test Blog Post Title',
    content: 'This is the full content of the test blog post. It is generated automatically.',
    excerpt: 'A short excerpt for the test blog post.',
    category: 'Test Category',
    tags: ['test', 'javascript', 'example'],
    author: 'testuser_jane_doe', // Ensure this user exists or is created by createTestUserInDB for FK constraints
    featured_image_url: 'https://placehold.co/600x400/EEE/31343C?text=Test_Image',
    status: 'published',
    reading_time_minutes: 5,
    view_count: 100,
    published_at: new Date(),
    ...blogData,
  };

  const query = `
    INSERT INTO blogs (
      title, content, excerpt, category, tags, author, 
      featured_image_url, status, reading_time_minutes, 
      view_count, published_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [
      testBlogData.title,
      testBlogData.content,
      testBlogData.excerpt,
      testBlogData.category,
      testBlogData.tags,
      testBlogData.author,
      testBlogData.featured_image_url,
      testBlogData.status,
      testBlogData.reading_time_minutes,
      testBlogData.view_count,
      testBlogData.published_at,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error creating test blog in DB:', error);
    throw error;
  }
};

// Helper to create blogs for pagination testing
export const createTestBlogsForPagination = async (totalCount = 25) => {
  const blogs = [];
  const batchSize = 10; // Insert in batches for better performance

  try {
    for (let batch = 0; batch < Math.ceil(totalCount / batchSize); batch++) {
      const batchBlogs = [];
      const currentBatchSize = Math.min(batchSize, totalCount - batch * batchSize);

      for (let i = 0; i < currentBatchSize; i++) {
        const blogIndex = batch * batchSize + i + 1;
        batchBlogs.push({
          title: `Blog Post Test ${blogIndex.toString().padStart(3, '0')}`,
          content: `This is the content for blog post number ${blogIndex}. It contains useful information and insights.`,
          excerpt: `Excerpt for blog post ${blogIndex}`,
          category: ['diabetes', 'nutrition', 'fitness', 'high blood pressure', 'lifestyle'][blogIndex % 5],
          tags: [`tag${blogIndex}`, 'test', 'pagination'],
          author: 'testuser_jane_doe',
          featured_image_url: `https://placehold.co/600x400/EEE/31343C?text=Blog_${blogIndex}`,
          status: 'published',
          reading_time_minutes: Math.floor(Math.random() * 10) + 3, // 3-12 minutes
          view_count: Math.floor(Math.random() * 500) + 50, // 50-550 views
          published_at: new Date(Date.now() - blogIndex * 24 * 60 * 60 * 1000), // Stagger dates
        });
      }

      // Batch insert
      const values = batchBlogs
        .map((_, index) => {
          const paramStart = index * 11;
          return `($${paramStart + 1}, $${paramStart + 2}, $${paramStart + 3}, $${paramStart + 4}, $${paramStart + 5}, $${paramStart + 6}, $${paramStart + 7}, $${paramStart + 8}, $${paramStart + 9}, $${paramStart + 10}, $${paramStart + 11})`;
        })
        .join(', ');

      const query = `
        INSERT INTO blogs (
          title, content, excerpt, category, tags, author, 
          featured_image_url, status, reading_time_minutes, 
          view_count, published_at
        )
        VALUES ${values}
        RETURNING *
      `;

      const flatParams = batchBlogs.flatMap((blog) => [
        blog.title,
        blog.content,
        blog.excerpt,
        blog.category,
        blog.tags,
        blog.author,
        blog.featured_image_url,
        blog.status,
        blog.reading_time_minutes,
        blog.view_count,
        blog.published_at,
      ]);

      const result = await pool.query(query, flatParams);
      blogs.push(...result.rows);
    }
    return blogs;
  } catch (error) {
    console.error('❌ Error creating pagination test blogs in DB:', error);
    throw error;
  }
};

// Helper to create multiple health check results for a user with valid data
export const createTestCheckResults = async (userId, count = 5) => {
  const results = [];
  // Define arrays of valid options based on the new schema
  const ageOptions = [3, 5, 7, 9];
  const incomeOptions = [1, 3, 5, 7, 8];
  const educationOptions = [3, 4, 5, 6];
  const genHlthOptions = [1, 2, 3, 4, 5];
  const physHlthOptions = [0, 7, 15, 30];
  const highBpOptions = [0, 1];
  const diabetesRiskOptions = [0, 1]; // 0 for non-diabetic, 1 for diabetic

  for (let i = 0; i < count; i++) {
    results.push({
      user_id: userId,
      bmi: parseFloat((18.5 + Math.random() * 21.5).toFixed(1)), // BMI between 18.5 and 40.0
      // Cycle through the valid options for each field
      age: ageOptions[i % ageOptions.length],
      income: incomeOptions[i % incomeOptions.length],
      education: educationOptions[i % educationOptions.length],
      gen_hlth: genHlthOptions[i % genHlthOptions.length],
      phys_hlth: physHlthOptions[i % physHlthOptions.length],
      high_bp: highBpOptions[i % highBpOptions.length],
      diabetes_result: diabetesRiskOptions[i % diabetesRiskOptions.length],
    });
  }

  const values = results
    .map((_, index) => {
      // FIX: The number of columns is 9, so the multiplier must be 9.
      const paramStart = index * 9;
      // FIX: The placeholder string must contain 9 placeholders.
      return `($${paramStart + 1}, $${paramStart + 2}, $${paramStart + 3}, $${paramStart + 4}, $${paramStart + 5}, $${paramStart + 6}, $${paramStart + 7}, $${paramStart + 8}, $${paramStart + 9})`;
    })
    .join(', ');

  const query = `
        INSERT INTO check_results (
            user_id, bmi, age, income, education, gen_hlth, phys_hlth, high_bp, diabetes_result
        ) VALUES ${values}
        RETURNING *
    `;

  const flatParams = results.flatMap((r) => [r.user_id, r.bmi, r.age, r.income, r.education, r.gen_hlth, r.phys_hlth, r.high_bp, r.diabetes_result]);

  try {
    const { rows } = await pool.query(query, flatParams);
    return rows;
  } catch (error) {
    console.error('❌ Error creating test check results in DB:', error);
    throw error;
  }
};

// Helper to get database connection stats
export const getConnectionStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};
