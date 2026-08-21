import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Organizations (Multi-tenant company profiles)
  await knex.schema.createTable('organizations', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.string('stripe_customer_id').nullable();
    table.string('stripe_subscription_id').nullable();
    table.string('subscription_status').defaultTo('none').notNullable();
    table.string('subscription_plan').defaultTo('free').notNullable();
    table.timestamps(true, true);
  });

  // 2. Users (Tenants can have multiple users)
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE').notNullable();
    table.string('name').notNullable();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('role').defaultTo('member').notNullable();
    table.timestamps(true, true);
  });

  // 3. Clients (Scoped by organization)
  await knex.schema.createTable('clients', (table) => {
    table.uuid('id').primary();
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE').notNullable();
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('company_name').nullable();
    table.string('tax_id').nullable();
    table.text('address').notNullable();
    table.string('phone').nullable();
    table.timestamps(true, true);

    table.index(['organization_id']);
  });

  // 4. Invoices (Scoped by organization)
  await knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary();
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE').notNullable();
    table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE').notNullable();
    table.string('invoice_number').notNullable();
    table.string('status').defaultTo('draft').notNullable(); // draft, sent, paid, overdue
    table.date('issue_date').notNullable();
    table.date('due_date').notNullable();
    table.decimal('tax_rate', 5, 2).defaultTo(0.00).notNullable();
    table.decimal('discount', 10, 2).defaultTo(0.00).notNullable();
    table.string('currency').defaultTo('USD').notNullable();
    table.text('notes').nullable();
    table.timestamps(true, true);

    // Compounded unique constraint: Invoice numbers unique per company
    table.unique(['organization_id', 'invoice_number']);
    table.index(['organization_id']);
    table.index(['client_id']);
  });

  // 5. Invoice Items (Individual rows on an invoice)
  await knex.schema.createTable('invoice_items', (table) => {
    table.uuid('id').primary();
    table.uuid('invoice_id').references('id').inTable('invoices').onDelete('CASCADE').notNullable();
    table.string('description').notNullable();
    table.decimal('quantity', 10, 2).notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.timestamps(true, true);

    table.index(['invoice_id']);
  });

  // 6. Payments (Record payments made towards invoices)
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary();
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE').notNullable();
    table.uuid('invoice_id').references('id').inTable('invoices').onDelete('CASCADE').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('payment_method').notNullable(); // stripe, bank_transfer, cash
    table.date('payment_date').notNullable();
    table.text('notes').nullable();
    table.timestamps(true, true);

    table.index(['organization_id']);
    table.index(['invoice_id']);
  });

  // 7. Simulated/Mock Email Log (for viewing invoice reminder logs)
  await knex.schema.createTable('email_logs', (table) => {
    table.uuid('id').primary();
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE').notNullable();
    table.uuid('invoice_id').references('id').inTable('invoices').onDelete('CASCADE').notNullable();
    table.string('to_email').notNullable();
    table.string('subject').notNullable();
    table.text('body').notNullable();
    table.timestamps(true, true);

    table.index(['organization_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('email_logs');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('invoice_items');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('clients');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('organizations');
}
