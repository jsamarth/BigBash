import { config } from 'dotenv';
import { resolve } from 'path';
import { NativeConnection, Worker } from '@temporalio/worker';
import { fetchVenuesActivity } from '@bigbash/workflows/src/activities/fetchVenuesActivity';
import { saveVenuesActivity } from '@bigbash/workflows/src/activities/saveVenuesActivity';

// Load environment variables from .env file (look in project root)
const projectRoot = resolve(__dirname, '../..');
const envPath = resolve(projectRoot, '.env');
console.log(`[Worker] Loading .env file from: ${envPath}`);
const result = config({ path: envPath });

if (result.error) {
  console.warn(`[Worker] Warning: Error loading .env file:`, result.error);
} else {
  console.log(`[Worker] .env file loaded successfully`);
  console.log(`[Worker] GOOGLE_PLACES_API_KEY is ${process.env.GOOGLE_PLACES_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`[Worker] TEMPORAL_ADDRESS: ${process.env.TEMPORAL_ADDRESS || 'not set (using default: localhost:7233)'}`);
  console.log(`[Worker] DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
}

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: 'venue-fetch-queue',
    workflowsPath: require.resolve('@bigbash/workflows/src/workflows/fetchVenuesWorkflow'),
    activities: {
      fetchVenuesActivity,
      saveVenuesActivity,
    },
  });

  console.log('Worker started, listening for tasks...');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

