import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('username', 50).unique().notNullable();
    table.string('email', 50).unique().notNullable();
    table.string('password', 255).notNullable();

    table.text('public_key').notNullable();
    
    table.boolean('two_factor_enabled').defaultTo(false);
    table.string('two_factor_secret', 255).nullable();

    table.string('avatar_url', 255).nullable();
    table.string('status', 100).defaultTo('online');
    table.timestamp('last_seen_at').defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
    `)
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TRIGGER IF EXITST update_users_updated_at ON users`);
  await knex.schema.dropTableIfExists('users');
}

