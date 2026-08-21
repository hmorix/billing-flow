import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organizations', (table) => {
    // Company Profile Information
    table.text('address').nullable();
    table.string('tax_id').nullable();
    table.string('phone').nullable();
    table.string('logo_url').nullable();

    // Company SMTP Server Configuration
    table.string('smtp_host').nullable();
    table.integer('smtp_port').nullable();
    table.string('smtp_user').nullable();
    table.string('smtp_pass').nullable();
    table.string('smtp_from').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organizations', (table) => {
    table.dropColumn('smtp_from');
    table.dropColumn('smtp_pass');
    table.dropColumn('smtp_user');
    table.dropColumn('smtp_port');
    table.dropColumn('smtp_host');
    table.dropColumn('logo_url');
    table.dropColumn('phone');
    table.dropColumn('tax_id');
    table.dropColumn('address');
  });
}
