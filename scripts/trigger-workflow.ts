#!/usr/bin/env ts-node
/**
 * Simple script to trigger the fetchVenues workflow
 * Usage: ts-node scripts/trigger-workflow.ts
 */

import { getTemporalClient } from '../../packages/infra/src/temporal';
import { fetchVenuesWorkflow } from '../../workflows/src/workflows/fetchVenuesWorkflow';

async function main() {
  try {
    const client = await getTemporalClient();
    
    const handle = await client.workflow.start(fetchVenuesWorkflow, {
      args: [{
        neighborhood: 'Williamsburg',
        limit: 10, // Small number for testing
      }],
      taskQueue: 'venue-fetch-queue',
      workflowId: `fetchVenues-test-${Date.now()}`,
    });
    
    console.log('✅ Workflow started!');
    console.log(`Workflow ID: ${handle.workflowId}`);
    console.log(`Run ID: ${handle.firstExecutionRunId}`);
    console.log(`\nView in Temporal UI: http://localhost:8080`);
    console.log(`Workflow will appear in the UI shortly...`);
    
    // Wait a bit and check status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const description = await handle.describe();
      console.log(`\nWorkflow Status: ${description.status.name}`);
    } catch (e) {
      console.log('\n(Workflow is starting...)');
    }
    
  } catch (error) {
    console.error('❌ Error starting workflow:', error);
    process.exit(1);
  }
}

main();


