import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('agreements');
  if (!hasTable) {
    await knex.schema.createTable('agreements', (table) => {
      table.uuid('id').primary();
      table.uuid('organization_id').nullable();
      table.string('agreement_number').unique().notNullable();
      table.string('agreement_type').notNullable();
      table.string('title').notNullable();
      table.string('first_party_name').notNullable();
      table.string('first_party_contact').nullable();
      table.text('first_party_address').nullable();
      table.string('second_party_name').notNullable();
      table.string('second_party_contact').nullable();
      table.text('second_party_address').nullable();
      table.text('payment_terms').nullable();
      table.decimal('total_amount', 12, 2).nullable();
      table.string('currency').defaultTo('INR');
      table.string('validity_period').nullable();
      table.text('terms_content').notNullable();
      table.string('language').defaultTo('bilingual');
      table.decimal('stamp_duty_amount', 8, 2).defaultTo(100);
      table.string('state_jurisdiction').defaultTo('Delhi, India');
      table.text('signer_photo_url').nullable();
      table.text('document_attachment_url').nullable();
      table.decimal('geo_lat', 10, 6).nullable();
      table.decimal('geo_lng', 10, 6).nullable();
      table.text('geo_address').nullable();
      table.string('digital_hash').unique().notNullable();
      table.string('status').defaultTo('executed');
      table.timestamps(true, true);

      table.index(['organization_id']);
      table.index(['digital_hash']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('agreements');
}
