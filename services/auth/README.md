# Auth Service

## Purpose
Handles user authentication, registration, and token management. Issues and verifies JWTs for secure access across the system.

## How to Run Locally
1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in required values.
3. Run database migrations:
   ```sh
   npm run prisma:migrate
   ```
4. Start the service:
   ```sh
   npm run dev
   ```

## API Endpoints
- `/login` – User login
- `/register` – User registration
- `/refresh` – Refresh JWT
- `/me` – Get current user info
- [Swagger/OpenAPI docs](http://localhost:3001/docs) (if available)

## Environment Variables
See `.env.example` for all variables. Key variables:
- `PORT`: Port to run the service
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: Secrets for JWTs
- `SERVICE_NAME`, `LOG_LEVEL`, `OTEL_SERVICE_NAME`: Service identity and observability

## Testing
```sh
npm test
```

## Useful Scripts
- `npm run dev`: Start in development mode
- `npm run build`: Build TypeScript
- `npm run prisma:migrate`: Run DB migrations

## Observability
- Exports traces and metrics if configured

## Contact
For questions, contact the maintainers.
