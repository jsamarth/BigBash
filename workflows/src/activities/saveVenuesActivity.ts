import { config } from 'dotenv';
import { resolve } from 'path';
import { Context } from '@temporalio/activity';
import { getDatabase } from '@bigbash/infra';
import type { VenueInput } from '@bigbash/common-types';

// Load environment variables - activities may run in separate context
// Look for .env in project root (3 levels up from workflows/src/activities)
const projectRoot = resolve(__dirname, '../../../..');
const envPath = resolve(projectRoot, '.env');
const envResult = config({ path: envPath });
if (envResult.error) {
  console.warn(`[SaveActivity] Warning: Error loading .env file from ${envPath}:`, envResult.error);
}

export interface SaveVenuesActivityInput {
  venues: VenueInput[];
}

export interface SaveVenuesActivityOutput {
  inserted: number;
  updated: number;
}

export const saveVenuesActivity = async (
  input: SaveVenuesActivityInput
): Promise<SaveVenuesActivityOutput> => {
  const logger = Context.current().log;
  const db = getDatabase();
  
  let inserted = 0;
  let updated = 0;

  for (const venue of input.venues) {
    try {
      // Check if venue exists
      const existing = await db('venue')
        .where('gmaps_place_id', venue.gmaps_place_id)
        .first();

      if (existing) {
        // Update existing venue
        await db('venue')
          .where('gmaps_place_id', venue.gmaps_place_id)
          .update({
            name: venue.name,
            latitude: venue.latitude,
            longitude: venue.longitude,
            address: venue.address,
            website: venue.website,
            phone_number: venue.phone_number,
            updated_at: db.fn.now(),
          });
        updated++;
        logger.info(`Updated venue: ${venue.name}`);
      } else {
        // Insert new venue
        await db('venue').insert({
          name: venue.name,
          gmaps_place_id: venue.gmaps_place_id,
          latitude: venue.latitude,
          longitude: venue.longitude,
          address: venue.address,
          website: venue.website,
          phone_number: venue.phone_number,
        });
        inserted++;
        logger.info(`Inserted venue: ${venue.name}`);
      }
    } catch (error) {
      logger.error(`Error saving venue ${venue.gmaps_place_id}: ${error}`);
    }
  }

  return { inserted, updated };
};

