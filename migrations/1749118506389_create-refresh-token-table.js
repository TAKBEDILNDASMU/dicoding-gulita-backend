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
  // Create refresh_tokens table
  pgm.createTable('refresh_tokens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    token: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for better performance
  pgm.createIndex('refresh_tokens', 'user_id', {
    name: 'idx_refresh_tokens_user_id',
  });

  pgm.createIndex('refresh_tokens', 'expires_at', {
    name: 'idx_refresh_tokens_expires_at',
  });

  pgm.createIndex('refresh_tokens', 'token', {
    name: 'idx_refresh_tokens_token',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drop indexes first
  pgm.dropIndex('refresh_tokens', 'token', {
    name: 'idx_refresh_tokens_token',
    ifExists: true,
  });

  pgm.dropIndex('refresh_tokens', 'expires_at', {
    name: 'idx_refresh_tokens_expires_at',
    ifExists: true,
  });

  pgm.dropIndex('refresh_tokens', 'user_id', {
    name: 'idx_refresh_tokens_user_id',
    ifExists: true,
  });

  // Drop the table
  pgm.dropTable('refresh_tokens');
};
