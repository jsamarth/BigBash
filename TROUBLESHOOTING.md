# Troubleshooting Guide

## Workflow Not Showing in Temporal UI

If you don't see workflows in the Temporal UI, check the following:

### 1. Verify Services Are Running

```bash
# Check if Docker services are up
docker-compose ps

# Check Temporal logs
docker-compose logs temporal

# Check Temporal UI logs
docker-compose logs temporal-ui
```

### 2. Verify Worker is Running

The worker must be running for workflows to execute:

```bash
npm run dev:worker
```

You should see: `Worker started, listening for tasks...`

### 3. Trigger the Workflow Manually

Workflows only appear in Temporal UI after they're triggered. Trigger it manually:

```bash
# Using curl
curl -X POST http://localhost:3000/api/workflows/fetchVenues \
  -H "Content-Type: application/json" \
  -d '{"neighborhood": "Williamsburg", "limit": 10}'

# Or using the API directly if server is running
```

### 4. Check Temporal UI

1. Open http://localhost:8080
2. Go to "Workflows" tab
3. You should see workflows listed there after triggering

### 5. Verify Connection

Check that the worker can connect to Temporal:

```bash
# Check worker logs for connection errors
# The worker should show: "Worker started, listening for tasks..."
```

### 6. Check Namespace

Make sure the worker and API are using the same namespace (default: "default"):

- Worker: `TEMPORAL_NAMESPACE=default` (or check .env)
- API: `TEMPORAL_NAMESPACE=default` (or check .env)
- Temporal UI: Should show "default" namespace

### 7. Verify Task Queue

Ensure worker and workflow use the same task queue:
- Worker taskQueue: `venue-fetch-queue`
- Workflow taskQueue: `venue-fetch-queue`

### 8. Check for Errors

```bash
# Check worker logs
npm run dev:worker

# Check API logs
npm run dev:api

# Check Temporal server logs
docker-compose logs temporal | tail -50
```

## Common Issues

### "Workflow type not found"
- Make sure the worker is running
- Verify the workflow is properly exported
- Check that workflowsPath in worker.ts points to the correct file

### "Activity not found"
- Verify activities are registered in the worker
- Check activity function names match

### "Connection refused"
- Ensure Temporal server is running: `docker-compose ps`
- Check TEMPORAL_ADDRESS in .env matches the server address

### Schedule Not Running
- Schedules need to be created first
- Check schedule creation logs in API startup
- Create schedule manually via Temporal UI or CLI


