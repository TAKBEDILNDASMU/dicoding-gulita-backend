/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // Ensure the uuid-ossp extension is available (only needs to be done once)
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  pgm.createTable('user_health_data', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"(id)',
      onDelete: 'cascade',
    },
    bmi: {
      type: 'real',
      notNull: true,
    },
    income: {
      type: 'integer',
      notNull: false,
    },
    physical_activity: {
      type: 'boolean',
      notNull: true,
    },
    education_level: {
      type: 'varchar(50)',
      notNull: false,
    },
    general_health: {
      type: 'varchar(50)',
      notNull: false,
    },
    mental_health_score: {
      type: 'integer',
      notNull: false,
    },
    prediction_result: {
      type: 'boolean',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
      notNull: true,
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('user_health_data');
};
