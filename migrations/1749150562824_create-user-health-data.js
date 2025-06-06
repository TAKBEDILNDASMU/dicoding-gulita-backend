/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  // Define custom types for categorical data
  pgm.createType('health_status', ['low', 'medium', 'high']);
  pgm.createType('education_level', ['elementary', 'junior', 'senior', 'college']);
  pgm.createType('diabetes_risk', ['non-diabetic', 'diabetic']);

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
      type: 'real',
      notNull: true,
    },
    age: {
      type: 'integer',
      notNull: true,
    },
    income: {
      type: 'integer',
      notNull: true,
    },
    phys_hlth: {
      type: 'health_status',
      notNull: true,
    },
    education: {
      type: 'education_level',
      notNull: true,
    },
    gen_hlth: {
      type: 'health_status',
      notNull: true,
    },
    ment_hlth: {
      type: 'health_status',
      notNull: true,
    },
    diabetes_result: {
      type: 'diabetes_risk',
      notNull: true,
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
  pgm.dropTable('check_results');
  pgm.dropType('health_status');
  pgm.dropType('education_level');
  pgm.dropType('diabetes_risk');
};
