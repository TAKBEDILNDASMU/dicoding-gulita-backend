/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('blogs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    content: {
      type: 'text',
      notNull: true,
    },
    excerpt: {
      type: 'text',
      comment: 'Short description or summary of the blog post',
    },
    category: {
      type: 'varchar(100)',
      notNull: true,
      comment: 'Blog category (e.g., diabetes, nutrition, lifestyle)',
    },
    tags: {
      type: 'text[]',
      comment: 'Array of tags for better categorization',
    },
    author: {
      type: 'varchar(255)',
      notNull: true,
      comment: 'Author name or identifier',
    },
    featured_image_url: {
      type: 'text',
      comment: 'URL to the main blog image',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'published',
      comment: 'Blog status: draft, published, archived',
    },
    reading_time_minutes: {
      type: 'integer',
      comment: 'Estimated reading time in minutes',
    },
    view_count: {
      type: 'integer',
      notNull: true,
      default: 0,
      comment: 'Number of times the blog has been viewed',
    },
    published_at: {
      type: 'timestamp with time zone',
      notNull: false,
      default: pgm.func('NOW()'),
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes for better query performance
  pgm.createIndex('blogs', 'category');
  pgm.createIndex('blogs', 'status');
  pgm.createIndex('blogs', 'published_at');
  pgm.createIndex('blogs', ['category', 'status']);

  // Create GIN index for tags array (for efficient tag searching)
  pgm.createIndex('blogs', 'tags', { method: 'gin' });

  // Add check constraint for status
  pgm.addConstraint('blogs', 'blogs_status_check', {
    check: "status IN ('draft', 'published', 'archived')",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('blogs');
};
