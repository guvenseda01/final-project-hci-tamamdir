const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tamamdır API',
      version: '1.0.0',
      description: 'Peer-to-peer services marketplace API. Built with Node.js, Express, and SQLite.',
      contact: {
        name: 'Tamamdır Team',
        url: 'https://github.com/tamamdir/api',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: process.env.API_URL || 'http://localhost:4000',
        description: 'Current environment',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from /auth/login or /auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            full_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatar_url: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            department: { type: 'string', nullable: true },
            year: { type: 'string', nullable: true },
            email_verified: { type: 'boolean', description: 'Completed email verification code flow' },
            is_verified_student: { type: 'boolean', description: 'Verified IYTE student badge (requires email_verified)' },
            is_provider: { type: 'boolean' },
            wallet_balance: { type: 'number' },
            rating: { type: 'number' },
            review_count: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            provider_id: { type: 'string', format: 'uuid' },
            category_id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            price_unit: { type: 'string' },
            delivery_days: { type: 'integer' },
            is_active: { type: 'boolean' },
            rating: { type: 'number' },
            review_count: { type: 'integer' },
            order_count: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            service_id: { type: 'string', format: 'uuid' },
            buyer_id: { type: 'string', format: 'uuid' },
            provider_id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['pending', 'accepted', 'started', 'completed', 'cancelled'] },
            price_at_order: { type: 'number' },
            note: { type: 'string', nullable: true },
            scheduled_at: { type: 'string', format: 'date-time', nullable: true },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
            cancelled_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            icon: { type: 'string' },
            slug: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  msg: { type: 'string' },
                  param: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
