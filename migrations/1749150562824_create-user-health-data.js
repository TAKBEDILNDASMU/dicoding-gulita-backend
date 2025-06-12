/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.createTable('check_results', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"(id)',
      onDelete: 'CASCADE',
    },
    bmi: {
      // Changed to double precision for Float64
      type: 'double precision',
      notNull: true,
    },
    age: {
      type: 'integer',
      notNull: true,
      // Added CHECK constraint for specific values
      check: 'age IN (3, 5, 7, 9)',
    },
    income: {
      type: 'integer',
      notNull: true,
      // Added CHECK constraint for specific values
      check: 'income IN (1, 3, 5, 7, 8)',
    },
    education: {
      type: 'integer',
      notNull: true,
      // Added CHECK constraint for specific values
      check: 'education IN (3, 4, 5, 6)',
    },
    gen_hlth: {
      type: 'integer',
      notNull: true,
      // Added CHECK constraint for specific values
      check: 'gen_hlth IN (1, 2, 3, 4, 5)',
    },
    phys_hlth: {
      type: 'integer',
      notNull: true,
      // Added CHECK constraint for specific values
      check: 'phys_hlth IN (0, 7, 15, 30)',
    },
    high_bp: {
      type: 'integer',
      notNull: true,
      // Added CHECK constraint for specific values
      check: 'high_bp IN (0, 1)',
    },
    diabetes_result: {
      // Changed to integer, assuming 0 for non-diabetic and 1 for diabetic
      type: 'integer',
      notNull: true,
      check: 'diabetes_result IN (0, 1)',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  // The down migration simply drops the table.
  // The custom types are no longer created, so no need to drop them.
  pgm.dropTable('check_results');
};
