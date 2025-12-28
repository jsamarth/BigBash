import { getTemporalClient } from '@bigbash/infra';

/**
 * Setup scheduled workflow to run fetchVenues daily
 * Note: Schedules can be created via Temporal UI or CLI
 * This is a helper function that can be called manually
 */
export async function setupScheduledWorkflow() {
  const client = await getTemporalClient();
  
  try {
    // Create or update schedule
    await client.schedule.create({
      scheduleId: 'fetchVenues-daily',
      spec: {
        calendars: [
          {
            comment: 'Run daily at 2 AM',
            hour: [2],
            minute: [0],
          },
        ],
      },
      action: {
        type: 'startWorkflow',
        workflowType: 'fetchVenuesWorkflow',
        taskQueue: 'venue-fetch-queue',
        workflowId: 'fetchVenues-${timestamp}',
        args: [
          {
            neighborhood: 'Williamsburg',
            limit: 100,
          },
        ],
      },
    });
    
    console.log('Scheduled workflow created: fetchVenues-daily');
  } catch (error) {
    // Schedule might already exist, that's okay
    if (String(error).includes('already exists') || String(error).includes('ScheduleAlreadyExists')) {
      console.log('Schedule already exists, skipping creation');
    } else {
      console.error('Error creating schedule:', error);
    }
  }
}

