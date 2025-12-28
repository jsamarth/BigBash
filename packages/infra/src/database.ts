import knex, { Knex } from 'knex';
import config from '../knexfile';

let dbInstance: Knex | null = null;

export function getDatabase(): Knex {
  if (!dbInstance) {
    const env = process.env.NODE_ENV || 'development';
    dbInstance = knex(config[env]);
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
  }
}


