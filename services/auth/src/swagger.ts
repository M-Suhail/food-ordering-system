import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0'
    },
    components: {
      schemas: {
        Order: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            restaurantId: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  qty: { type: 'number' }
                }
              }
            },
            total: { type: 'number' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
});


