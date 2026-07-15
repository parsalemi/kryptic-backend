import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  await knex.raw(` 
    CREATE OR REPLACE FUNCTION update_updated_at_column() 
    RETURNS TRIGGER AS $$ 
    BEGIN 
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;  
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column')
}