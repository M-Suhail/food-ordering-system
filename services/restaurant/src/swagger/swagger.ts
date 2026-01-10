import swaggerJsdoc from 'swagger-jsdoc';


export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant Service API',
      version: '1.0.0'
    },
    components: {
      schemas: {
        Restaurant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            menus: {
              type: 'array',
              items: { $ref: '#/components/schemas/Menu' }
            }
          }
        },
        Menu: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            restaurantId: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/MenuItem' }
            }
          }
        },
        MenuItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            menuId: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
});


