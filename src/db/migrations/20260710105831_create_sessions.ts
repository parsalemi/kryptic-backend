import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    table.string('token', 500).notNullable();
    table.string('refresh_token', 500).notNullable();
    table.string('ip_address', 45).notNullable();
    table.string('user_agent', 255).notNullable();

    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false);

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('token');
    table.index('refresh_token');
    table.index('expires_at');
  });

  await knex.raw(`
    CREATE OR REPLACE FUNCTION clean_expired_sessions() 
    RETURNS TRIGGER AS $$ 
    BEGIN 
      DELETE FROM sessions WHERE expires_at < NOW() OR is_revoked = true;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER auto_clean_sessions
    AFTER INSERT ON sessions
    EXECUTE FUNCTION clean_expired_sessions();
  `);
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS auto_clean_sessions ON sessions');
  await knex.raw('DROP FUNCTION IF EXISTS clean_expired_sessions');
  await knex.schema.dropTableIfExists('sessions');
}

