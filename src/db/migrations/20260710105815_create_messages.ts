import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('receiver_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    table.text('content').notNullable();
    table.text('session_key').notNullable();
    table.string('iv', 64).notNullable();

    table.uuid('media_id').nullable();
    table.string('media_type', 50).nullable();
    table.string('media_path', 255).nullable();
    table.string('media_enc_key', 255).nullable();

    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.boolean('is_delivered').defaultTo(false);
    table.timestamp('delivered_at').nullable();

    table.timestamp('deleted_at').nullable();
    table.boolean('is_deleted').defaultTo(false);

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['sender_id', 'receiver_id']);
    table.index(['receiver_id', 'is_read']);
    table.index('created_at');
    table.index('deleted_at');
    table.index('is_deleted');
  });

  await knex.raw(`
    CREATE OR REPLACE FUNCTION delete_read_messages() 
    RETURNS TRIGGER AS $$ 
    BEGIN 
      DELETE FROM messages 
      WHERE is_read = true AND read_at < (NOW() - INTERVAL '30 minutes') AND is_deleted = false;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER auto_delete_read_messages 
    AFTER UPDATE OF is_read ON messages 
    FOR EACH ROW 
    WHEN (NEW.is_read = true) 
    EXECUTE FUNCTION delete_read_messages();
  `);

  await knex.raw(`
    CREATE INDEX idx_messages_auto_delete On messages (is_read, read_at, is_deleted) 
    WHERE is_read = true AND is_deleted = false;
  `);
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS auto_delete_read_messages ON messages');
  await knex.raw('DROP FUNCTION IF EXISTS delete_read_messages');
  await knex.schema.dropTableIfExists('messages');
}

