import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('two_factor_auth', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    table.string('secret', 255).notNullable();
    table.string('backup_codes', 1000).nullable();
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('verified_at').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique('user_id');
    table.index('user_id');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('two_factor_auth');
}

