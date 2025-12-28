# BigBash Web App

A Node.js/Express web application with Temporal workflows for fetching and managing venues from Google Maps API.

## Architecture

- **Monorepo**: npm workspaces with multiple packages
- **Backend**: Express API server
- **Database**: PostgreSQL with Knex migrations
- **Workflows**: Temporal for async job processing
- **Frontend**: React (to be added)

## Project Structure

```
bigbash/
├── packages/
│   ├── api/          # Express API server
│   ├── common_types/ # Shared TypeScript types
│   └── infra/        # Database and infrastructure setup
├── workflows/        # Temporal workflows and activities
└── workers/          # Temporal workers
```

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Google Maps Places API key

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `GOOGLE_PLACES_API_KEY` - Your Google Maps API key
- `DATABASE_URL` - PostgreSQL connection string (or use individual DB_* vars)

### 3. Start Docker Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Temporal server on port 7233
- Temporal UI on port 8080

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Start the Worker

In one terminal:

```bash
npm run dev:worker
```

### 6. Start the API Server

In another terminal:

```bash
npm run dev:api
```

The API will be available at `http://localhost:3000`

## Usage

### API Endpoints

- `GET /health` - Health check
- `GET /api/venues` - Get all venues
- `GET /api/venues/:id` - Get venue by ID
- `POST /api/workflows/fetchVenues` - Trigger fetchVenues workflow
- `GET /api/workflows/:workflowId` - Get workflow status

### Triggering the Workflow

The workflow runs automatically daily at 2 AM. You can also trigger it manually:

```bash
curl -X POST http://localhost:3000/api/workflows/fetchVenues \
  -H "Content-Type: application/json" \
  -d '{"neighborhood": "Williamsburg", "limit": 100}'
```

### Temporal UI

Access the Temporal UI at `http://localhost:8080` to monitor workflows.

## Workflow: fetchVenues

The `fetchVenues` workflow:
1. Searches Google Maps API for bars and cafes in a neighborhood
2. Filters results to only include venues with websites
3. Limits to 100 venues
4. Fetches detailed information for each venue
5. Inserts/updates venues in the database

## Database Schema

The `venue` table has the following columns:
- `id` - Primary key
- `name` - Venue name
- `gmaps_place_id` - Google Maps place ID (unique)
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate
- `address` - Formatted address
- `website` - Website URL
- `phone_number` - Phone number
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Development

### Build All Packages

```bash
npm run build
```

### Run Migrations

```bash
npm run migrate          # Run pending migrations
npm run migrate:latest   # Run all migrations
npm run migrate:rollback # Rollback last migration
```

## Next Steps

- Add React frontend (packages/web_app)
- Add map view integration
- Add event scraping integration
- Add distance-based venue search

