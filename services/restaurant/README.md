# Restaurant Service

## Purpose
Manages restaurant data, menu items, and restaurant-related business logic. Provides APIs for restaurant CRUD operations.

## How to Run Locally
1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in required values.
3. Run database migrations (if needed):
   ```sh
   npx prisma migrate dev
   ```
4. Start the service:
   ```sh
   npm run dev
   ```

## API Endpoints
- `/health` – Health check
- `/restaurants` – CRUD endpoints for restaurants
- [Swagger/OpenAPI docs](http://localhost:3003/docs) (if available)

## Environment Variables
See `.env.example` for all variables. Key variables:
- `PORT`: Port to run the service
- `DATABASE_URL`: Database connection string
- `SERVICE_NAME`, `LOG_LEVEL`, `OTEL_SERVICE_NAME`: Service identity and observability

## Testing
```sh
npm test
```

## Useful Scripts
- `npm run dev`: Start in development mode
- `npm run build`: Build TypeScript

## Observability
- Exports traces and metrics if configured

## Contact
For questions, contact the maintainers.
