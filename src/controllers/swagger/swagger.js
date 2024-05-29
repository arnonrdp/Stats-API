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
    { url: 'https://stats-api-5uzvedliwa-ey.a.run.app/v1', description: 'Production server' },
    { url: 'http://localhost:6001/v1', description: 'Local server' }
  ],

  paths: {
    '/topic': {
      post: {
        tags: ['Topics'],
        summary: 'Add topic to the database',
        operationId: 'createTopic',
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AddTopicResponse' } } }
          },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      get: {
        tags: ['Topics'],
        summary: 'Get topic by topic_id',
        operationId: 'getTopic',
        requestBody: {
          description: 'topic_id ',
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { topic_id: { type: 'string' } } } } }
        },
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ArticleStats' } } } }
          },
          400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },

    '/stats': {
      post: {
        tags: ['Stats'],
        summary: 'Add a stat to the database',
        operationId: 'create',
        requestBody: {
          description: 'The stat to add',
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/StatInput' } } }
        },
        responses: {
          201: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/StatResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      get: {
        tags: ['Stats'],
        summary: 'Get all stats from the database',
        operationId: 'getAllStats',
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Stat' } } } }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },

    '/stats/article': {
      get: {
        tags: ['Stats'],
        summary: 'Get summary stats from the database by article_id',
        operationId: 'getArticleStats',
        requestBody: {
          description: 'article_id to get stats for',
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { article_id: { type: 'string' } } } } }
        },
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ArticleStats' } } } }
          },
          400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },

    '/stats/users-locations': {
      get: {
        tags: ['Stats'],
        summary: 'Get Total Users for each location',
        operationId: 'getUsersLocations',
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserLocationsResponse' } } }
          },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    }
  },
  components: {
    schemas: {
      UserLocationsResponse: {
        type: 'object',
        properties: {
          locations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                location: { type: 'string', example: 'US' },
                users: { type: 'integer', example: 2 }
              }
            }
          }
        }
      },

      AddTopicResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          message: { type: 'string' }
        }
      },

      Stat: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          created_at: { type: 'string', format: 'timestamp', example: '2022-01-01T00:00:00.000Z' },
          user_id: { type: 'string', example: 'umHBjOjh0HVCJC9AYyovyequteD3' },
          article_id: { type: 'string', example: '2023-11T1699089204478' },
          topic_id: { type: 'string', example: '2024-04' },
          clicks: { type: 'integer', example: 7 },
          keypresses: { type: 'integer', example: 14 },
          mouseMovements: { type: 'integer', example: 200 },
          scrolls: { type: 'integer', example: 58 },
          totalTime: { type: 'integer', example: 24 }
        }
      },

      ArticleStats: {
        type: 'object',
        properties: {
          post_id: { type: 'string', example: '2023-11T1699089204478' },
          visits: { type: 'integer', example: 7 },
          visitors: { type: 'integer', example: 14 },
          clicks: { type: 'integer', example: 200 },
          keypresses: { type: 'integer', example: 58 },
          mousemovements: { type: 'integer', example: 24 },
          scrolls: { type: 'integer', example: 24 },
          totaltime: { type: 'integer', example: 24 },
          location: { type: 'string', example: 'Canada/Yukon' }
        }
      },

      StatInput: {
        type: 'object',
        properties: {
          user_id: { type: 'string', example: 'umHBjOjh0HVCJC9AYyovyequteD3' },
          article_id: { type: 'string', example: '2023-11T1699089204478' },
          clicks: { type: 'integer', example: 7 },
          keypresses: { type: 'integer', example: 14 },
          mouseMovements: { type: 'integer', example: 200 },
          scrolls: { type: 'integer', example: 58 },
          totalTime: { type: 'integer', example: 24 }
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
      NotFound: { description: 'Not found' },
      BadRequest: { description: 'Bad request' }
    }
  },

  tags: [{ name: 'Topics' }, { name: 'Articles' }, { name: 'Stats' }, { name: 'Reactions' }, { name: 'Comments' }, { name: 'Shares' }]
}

window.onload = function () {
  SwaggerUIBundle({
    spec: spec,
    dom_id: '#swagger-ui'
  })
}
