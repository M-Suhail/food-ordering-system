# API Gateway Service

## Purpose
Acts as the single entry point for all client requests, routing them to the appropriate backend services and handling authentication, rate limiting, and aggregation.

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
- All endpoints are proxied to backend services.
- Authentication and rate limiting are enforced.
- [Swagger/OpenAPI docs](http://localhost:3000/docs) (if available)

## Environment Variables
See `.env.example` for all variables. Key variables:
- `PORT`: Port to run the gateway
- `JWT_SECRET`: Secret for JWT verification
- `AUTH_SERVICE_URL`, `ORDER_SERVICE_URL`, etc.: URLs for backend services
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`: Rate limiting config
- `SERVICE_NAME`, `LOG_LEVEL`, `OTEL_SERVICE_NAME`: Service identity and observability

## Testing
```sh
npm test
```

## Useful Scripts
- `npm run dev`: Start in development mode
- `npm run build`: Build TypeScript
- `npm start`: Start built server

## Observability
- Exports traces and metrics if configured

## Contact
For questions, contact the maintainers.
