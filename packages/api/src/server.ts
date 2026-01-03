import { config } from 'dotenv';
import { resolve } from 'path';
import express from 'express';
import { getDatabase } from '@bigbash/infra';
import { getTemporalClient } from '@bigbash/infra';
import { fetchVenuesWorkflow } from '@bigbash/workflows/src/workflows/fetchVenuesWorkflow';
import { setupScheduledWorkflow } from './schedules';
import type { FetchVenuesWorkflowInput } from '@bigbash/common-types';
import venuesRouter from './routes/venues';

// Load environment variables from .env file (look in project root, not package directory)
const projectRoot = resolve(__dirname, '../../..');
const envPath = resolve(projectRoot, '.env');
console.log(`[API] Loading .env file from: ${envPath}`);
const envResult = config({ path: envPath });

if (envResult.error) {
  console.warn(`[API] Warning: Error loading .env file:`, envResult.error);
} else {
  console.log(`[API] .env file loaded successfully`);
  console.log(`[API] GOOGLE_PLACES_API_KEY is ${process.env.GOOGLE_PLACES_API_KEY ? 'SET' : 'NOT SET'}`);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Setup scheduled workflow on startup
setupScheduledWorkflow().catch(console.error);

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const db = getDatabase();
    await db.raw('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: String(error) });
  }
});

// Venue routes
app.use('/api/venues', venuesRouter);

// Trigger fetchVenues workflow
app.post('/api/workflows/fetchVenues', async (req, res) => {
  try {
    const client = await getTemporalClient();
    const input: FetchVenuesWorkflowInput = req.body || {};
    
    const handle = await client.workflow.start(fetchVenuesWorkflow, {
      args: [input],
      taskQueue: 'venue-fetch-queue',
      workflowId: `fetchVenues-${Date.now()}`,
    });
    
    console.log(`Started workflow: ${handle.workflowId}`);
    
    res.json({
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
      message: 'Workflow started',
    });
  } catch (error) {
    console.error('Error starting workflow:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Get workflow status
app.get('/api/workflows/:workflowId', async (req, res) => {
  try {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(req.params.workflowId);
    
    try {
      const result = await handle.result();
      res.json({
        workflowId: req.params.workflowId,
        status: 'completed',
        result,
      });
    } catch (error) {
      // Workflow might still be running
      const description = await handle.describe();
      res.json({
        workflowId: req.params.workflowId,
        status: description.status.name,
        runId: description.runId,
      });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// List all workflows
app.get('/api/workflows', async (req, res) => {
  try {
    const client = await getTemporalClient();
    // Note: This requires workflow visibility to be enabled
    // For now, just return a message
    res.json({ 
      message: 'Use /api/workflows/:workflowId to check specific workflow status',
      note: 'Check Temporal UI at http://localhost:8080 for all workflows'
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

