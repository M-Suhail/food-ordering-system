# Delivery Service

## Purpose
Manages delivery assignments and tracks the status of orders as they are delivered to customers.

## How to Run Locally
1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in required values.
3. Start the service:
   ```sh
   npm run dev
   ```

## API Endpoints
- `/health` – Health check
- [Swagger/OpenAPI docs](http://localhost:3006/docs) (if available)

## Environment Variables
See `.env.example` for all variables. Key variables:
- `PORT`: Port to run the service
- `RABBITMQ_URL`: RabbitMQ connection string
- `MONGO_URL`: MongoDB connection string
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
