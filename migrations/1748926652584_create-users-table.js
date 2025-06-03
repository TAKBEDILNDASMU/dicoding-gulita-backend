// migrations/xxxxxxxxxxxxxx-create-users-table.js
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    email: { type: 'text', notNull: true, unique: true },
    username: { type: 'text', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  // Trigger for updated_at (example)
  pgm.sql(`
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

export const down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS set_users_updated_at ON users;');
  pgm.sql('DROP FUNCTION IF EXISTS trigger_set_timestamp();');
  pgm.dropTable('users');
  // pgm.dropExtension('uuid-ossp', { ifExists: true }); // Be careful if other tables use it
};
