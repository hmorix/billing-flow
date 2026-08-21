import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organizations', (table) => {
    table.text('email_template').defaultTo('professional').notNullable();
    table.text('invoice_template').defaultTo('modern_purple').alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organizations', (table) => {
    table.dropColumn('email_template');
  });
}
