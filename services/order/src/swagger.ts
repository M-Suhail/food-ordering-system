import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Service API',
      version: '1.0.0'
    },
    components: {
      schemas: {
        SubscriberResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
});

export { swaggerUi };
