import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service',
      version: '1.0.0',
      description: 'Authentication Service for Food Ordering System',
    },
  },
  apis: ['./src/routes/*.ts'], // Adjust path as needed
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };