import { config } from 'dotenv';
import { resolve } from 'path';
import { Context } from '@temporalio/activity';
import { Client, PlaceData } from '@googlemaps/google-maps-services-js';
import { VenueInput } from '@bigbash/common-types';

// Load environment variables - activities may run in separate context
// Look for .env in project root (3 levels up from workflows/src/activities)
const projectRoot = resolve(__dirname, '../../..');
const envPath = resolve(projectRoot, '.env');
const envResult = config({ path: envPath });
if (envResult.error) {
  console.warn(`[Activity] Warning: Error loading .env file from ${envPath}:`, envResult.error);
} else {
  console.log(`[Activity] .env file loaded from: ${envPath}`);
}

export interface FetchVenuesActivityInput {
  neighborhood: string;
  limit: number;
}

export interface FetchVenuesActivityOutput {
  venues: VenueInput[];
}

export const fetchVenuesActivity = async (
  input: FetchVenuesActivityInput
): Promise<FetchVenuesActivityOutput> => {
  const logger = Context.current().log;
  
  // Debug: Log environment variable status
  logger.info(`[Activity] Checking environment variables...`);
  logger.info(`[Activity] Attempted to load .env from: ${envPath}`);
  logger.info(`[Activity] .env load result: ${envResult.error ? 'ERROR - ' + envResult.error.message : 'SUCCESS'}`);
  logger.info(`[Activity] Process cwd: ${process.cwd()}`);
  logger.info(`[Activity] GOOGLE_PLACES_API_KEY is ${process.env.GOOGLE_PLACES_API_KEY ? 'SET (length: ' + process.env.GOOGLE_PLACES_API_KEY.length + ')' : 'NOT SET'}`);
  logger.info(`[Activity] NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  logger.info(`[Activity] All env vars with 'GOOGLE' or 'API': ${Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('API')).join(', ') || 'none'}`);
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    logger.error(`[Activity] GOOGLE_PLACES_API_KEY is missing. Available env vars: ${Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('API')).join(', ') || 'none'}`);
    throw new Error('GOOGLE_PLACES_API_KEY environment variable is not set');
  }

  const client = new Client({});
  const allResults: PlaceData[] = [];
  
  // Search query combining neighborhood with venue types
  const query = `${input.neighborhood} bars cafes venues`;
  
  try {
    // Text search for venues in the neighborhood
    const textSearchResult = await client.textSearch({
      params: {
        query: query,
        key: apiKey,
      },
    });

    if (textSearchResult.data.results) {
      // Filter out results without place_id
      const validResults = textSearchResult.data.results.filter(
        (r): r is PlaceData => r.place_id !== undefined && r.place_id !== null
      );
      allResults.push(...validResults);
    }

    // Also search by specific types
    const searchQueries = [
      `${input.neighborhood} bars`,
      `${input.neighborhood} cafes`,
      `${input.neighborhood} coffee shops`,
    ];

    for (const searchQuery of searchQueries) {
      try {
        const result = await client.textSearch({
          params: {
            query: searchQuery,
            key: apiKey,
          },
        });

        if (result.data.results) {
          // Filter out results without place_id
          const validResults = result.data.results.filter(
            (r): r is PlaceData => r.place_id !== undefined && r.place_id !== null
          );
          allResults.push(...validResults);
        }
      } catch (error) {
        logger.warn(`Error searching with query "${searchQuery}": ${error}`);
      }
    }

    // Remove duplicates based on place_id
    const seenIds = new Set<string>();
    const uniqueResults: PlaceData[] = [];
    
    for (const result of allResults) {
      if (result.place_id && !seenIds.has(result.place_id)) {
        seenIds.add(result.place_id);
        uniqueResults.push(result);
      }
    }

    logger.info(`Found ${uniqueResults.length} unique venues from search`);

    // Filter and fetch details for venues
    const filteredVenues: VenueInput[] = [];
    
    for (const venue of uniqueResults.slice(0, input.limit * 2)) { // Fetch more to account for filtering
      if (filteredVenues.length >= input.limit) {
        break;
      }

      // Check if it's a bar or cafe
      const types = venue.types || [];
      const typeStrings = types.map(t => String(t));
      const isBarOrCafe = typeStrings.includes('bar') || typeStrings.includes('cafe');
      
      if (!isBarOrCafe) {
        continue;
      }

      // Fetch place details to get website
      try {
        const detailsResult = await client.placeDetails({
          params: {
            place_id: venue.place_id,
            fields: ['name', 'formatted_address', 'website', 'formatted_phone_number', 'place_id', 'geometry'],
            key: apiKey,
          },
        });

        const details = detailsResult.data.result;
        
        // Check if venue has a website and place_id
        if (!details.website || !details.place_id) {
          continue;
        }

        const location = details.geometry?.location;
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
          continue;
        }

        filteredVenues.push({
          name: details.name || venue.name || 'Unknown',
          gmaps_place_id: details.place_id,
          latitude: location.lat,
          longitude: location.lng,
          address: details.formatted_address || null,
          website: details.website || null,
          phone_number: details.formatted_phone_number || null,
        });

        logger.info(`Processed venue: ${details.name}`);
      } catch (error) {
        logger.warn(`Error fetching details for place ${venue.place_id}: ${error}`);
        continue;
      }
    }

    logger.info(`Filtered to ${filteredVenues.length} venues (bars/cafes with websites)`);
    
    return { venues: filteredVenues };
  } catch (error) {
    logger.error(`Error searching for venues: ${error}`);
    throw error;
  }
};

