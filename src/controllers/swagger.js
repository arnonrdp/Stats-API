const spec = {
  openapi: '3.0.1',
  info: {
    description: 'This is the documentation for Stats API.',
    version: '1.0.0',
    title: 'Stats API'
  },
  externalDocs: {
    url: 'https://github.com/globe-and-citizen/Stats-API',
    description: 'Statistics from Celebrity Fanalyzer entries'
  },
  servers: [
    { url: 'https://stats-api.up.railway.app/v1', description: 'Production server' },
    { url: 'http://localhost:51787/v1', description: 'Local server' }
  ],
  paths: {
    '/stats': {
      post: {
        tags: ['Stats'],
        summary: 'Add a stat to the database',
        operationId: 'addStat',
        requestBody: {
          description: 'The stat to add',
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/StatInput' } } }
        },
        responses: {
          201: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/StatResponse' } } } },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      get: {
        tags: ['Stats'],
        summary: 'Get stats from the database',
        operationId: 'getStats',
        parameters: [
          { name: 'author', in: 'query', description: 'Search for stats by author name (optional)', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Stat' } } } }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    }
  },
  components: {
    schemas: {
      Stat: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          created_at: { type: 'string', format: 'timestamp', example: '2022-01-01T00:00:00.000Z' },
          user_id: { type: 'string', example: 'umHBjOjh0HVCJC9AYyovyequteD3' },
          post_id: { type: 'string', example: '2023-11T1699089204478' },
          clicks: { type: 'integer', example: 7 },
          keypresses: { type: 'integer', example: 14 },
          mousemovements: { type: 'integer', example: 200 },
          scrolls: { type: 'integer', example: 58 },
          totaltime: { type: 'integer', example: 24 }
        }
      },
      StatInput: {
        type: 'object',
        properties: {
          user_id: { type: 'string', example: 'umHBjOjh0HVCJC9AYyovyequteD3' },
          post_id: { type: 'string', example: '2023-11T1699089204478' },
          clicks: { type: 'integer', example: 7 },
          keypresses: { type: 'integer', example: 14 },
          mousemovements: { type: 'integer', example: 200 },
          scrolls: { type: 'integer', example: 58 },
          totaltime: { type: 'integer', example: 24 }
        }
      },
      StatResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          message: { type: 'string' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    },
    responses: {
      NoContent: { description: 'No content' },
      NotFound: { description: 'Not found' }
    }
  },
  tags: [{ name: 'Stats' }]
}

window.onload = function () {
  SwaggerUIBundle({
    spec: spec,
    dom_id: '#swagger-ui'
  })
}
