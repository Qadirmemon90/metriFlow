export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'MetriFlow Wholesale SaaS REST API',
    version: '1.0.0',
    description: 'Production-oriented wholesale management REST API contracts for Pakistani wholesalers.',
    contact: {
      name: 'MetriFlow Engineering',
      email: 'engineering@metriflow.pk',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Endpoints',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'metriflow_session',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          traceId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
          traceId: { type: 'string' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          sku: { type: 'string', example: 'SKU-001' },
          name: { type: 'string', example: 'Wheat Flour 10kg Bag' },
          category: { type: 'string', example: 'Grains' },
          baseUnit: { type: 'string', example: 'Piece' },
          defaultPricePaisa: { type: 'string', example: '15000' },
          costPricePaisa: { type: 'string', example: '10000' },
        },
      },
      OrderDraft: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
          warehouseId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'string', example: '30' },
                unitPricePaisa: { type: 'string', example: '15000' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/auth/signup': {
      post: {
        summary: 'Register new tenant organization and owner',
        responses: { 201: { description: 'Created' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive session cookie',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/orders/draft': {
      post: {
        summary: 'Create draft sales order',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 201: { description: 'Draft created' } },
      },
    },
    '/orders/{id}/confirm': {
      post: {
        summary: 'Atomically confirm order, serialize credit check and reserve stock',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Order confirmed' } },
      },
    },
    '/orders/dispatch': {
      post: {
        summary: 'Dispatch partial/full order, reduce stock and reserve, post invoice and ledger',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: { 201: { description: 'Dispatched and invoiced' } },
      },
    },
    '/finance/collections': {
      post: {
        summary: 'Submit payment collection evidence (no ledger effect until verified)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 201: { description: 'Collection submitted' } },
      },
    },
    '/finance/collections/{id}/verify': {
      post: {
        summary: 'Accountant verifies payment and posts ledger',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: 'Payment verified and posted' } },
      },
    },
    '/finance/returns': {
      post: {
        summary: 'Customer return with original cost restoration and AR credit note',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 201: { description: 'Return processed' } },
      },
    },
  },
};
