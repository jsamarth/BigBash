import { proxyActivities, log } from '@temporalio/workflow';
import type * as activities from '../activities/fetchVenuesActivity';
import type * as saveActivities from '../activities/saveVenuesActivity';
import type { FetchVenuesWorkflowInput, FetchVenuesWorkflowOutput } from '@bigbash/common-types';

const { fetchVenuesActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    maximumAttempts: 3,
  },
});

const { saveVenuesActivity } = proxyActivities<typeof saveActivities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
  },
});

export async function fetchVenuesWorkflow(
  input: FetchVenuesWorkflowInput = {}
): Promise<FetchVenuesWorkflowOutput> {
  const neighborhood = input.neighborhood || 'Williamsburg';
  const limit = input.limit || 100;

  log.info(`Starting fetchVenues workflow for neighborhood: ${neighborhood}, limit: ${limit}`);

  // Fetch venues from Google Maps API
  const { venues } = await fetchVenuesActivity({ neighborhood, limit });

  log.info(`Fetched ${venues.length} venues, now saving to database`);

  // Save venues to database
  const { inserted, updated } = await saveVenuesActivity({ venues });

  log.info(`Workflow completed: ${inserted} inserted, ${updated} updated`);

  return {
    venuesProcessed: venues.length,
    venuesInserted: inserted,
    venuesUpdated: updated,
  };
}

