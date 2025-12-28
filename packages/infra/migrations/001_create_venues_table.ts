import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('venue', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('gmaps_place_id').unique().notNullable();
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.text('address');
    table.text('website');
    table.string('phone_number');
    table.timestamps(true, true);
    
    // Index for location-based queries
    table.index(['latitude', 'longitude']);
    // Index for place_id lookups
    table.index('gmaps_place_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('venue');
}


