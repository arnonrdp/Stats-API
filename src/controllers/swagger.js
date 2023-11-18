const spec = {
  openapi: '3.0.1',
  info: {
    description: "This is the API documentation for We've Got Poems.",
    version: '1.0.0',
    title: "We've Got Poems API"
  },
  externalDocs: {
    url: 'https://github.com/globe-and-citizen/weve-got-poems',
    description: 'The canonical repo for Layer8\'s original Service Provider: "We\'ve Got Poems"'
  },
  servers: [
    { url: 'https://api-wevegotpoems.up.railway.app/v1', description: 'Production server' },
    { url: 'http://localhost:51787/v1', description: 'Local server' }
  ],
  paths: {
    '/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        operationId: 'loginUser',
        requestBody: {
          description: 'User login credentials',
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } }
        },
        responses: {
          201: {
            description: 'Success',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } }
          },
          401: { description: 'Unauthorized', $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/nonce': {
      get: {
        tags: ['Authentication'],
        summary: 'Generate a nonce for Ethereum authentication',
        operationId: 'generateNonce',
        responses: {
          200: { description: 'Success', content: { 'text/plain': { schema: { type: 'string' } } } },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/siwe': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in with Ethereum',
        operationId: 'ethereumAuthentication',
        requestBody: {
          description: 'The message and signature to sign in with Ethereum',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'The message to be signed',
                    example:
                      'localhost:8080 wants you to sign in with your Ethereum account:\n0x9D85ca56217D2bb651b00f15e694EB7E713637D4\n\nSign in with Ethereum to the app.\n\nURI: http://localhost:8080\nVersion: 1\nChain ID: 1\nNonce: spAsCWHwxsQzLcMzi\nIssued At: 2022-01-29T03:22:26.716Z'
                  },
                  signature: {
                    type: 'string',
                    description: 'The Ethereum signature of the message',
                    example:
                      '0xe117ad63b517e7b6823e472bf42691c28a4663801c6ad37f7249a1fe56aa54b35bfce93b1e9fa82da7d55bbf0d75ca497843b0702b9dfb7ca9d9c6edb25574c51c'
                  }
                },
                required: ['message', 'signature']
              }
            }
          }
        },
        responses: {
          201: { description: 'Success', content: { 'application/json': { schema: { type: 'boolean' } } } },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/poems': {
      post: {
        tags: ['Poems'],
        summary: 'Add a poem to the database',
        operationId: 'addPoem',
        security: [{ JWTAuth: [] }],
        requestBody: {
          description: 'The poem to add',
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PoemInput' } } }
        },
        responses: {
          201: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/PoemResponse' } } } },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      get: {
        tags: ['Poems'],
        summary: 'Get poems from the database',
        operationId: 'getPoems',
        parameters: [
          { name: 'title', in: 'query', description: 'Search for poems by title (optional)', schema: { type: 'string' } },
          { name: 'author', in: 'query', description: 'Search for poems by author name (optional)', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Poem' } } } }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/authors': {
      get: {
        tags: ['Poems'],
        summary: 'Get authors from the database',
        operationId: 'getAuthors',
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Author' } }
              }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/poems/{id}': {
      put: {
        tags: ['Poems'],
        summary: 'Update a poem in the database',
        operationId: 'updatePoem',
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'The ID of the poem to update',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          description: 'The poem to update',
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PoemInput' } } }
        },
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      delete: {
        tags: ['Poems'],
        summary: 'Delete a poem from the database',
        operationId: 'deletePoem',
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'The ID of the poem to delete',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          204: { $ref: '#/components/responses/NoContent' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/poems/{id}/like': {
      post: {
        tags: ['Likes & Dislikes'],
        summary: 'Like a poem',
        operationId: 'likePoem',
        security: [{ JWTAuth: [] }],
        parameters: [{ name: 'id', in: 'path', description: 'The ID of the poem to like', required: true, schema: { type: 'integer' } }],
        responses: {
          201: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/LikeResponse' } } } },
          400: { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/poems/{id}/dislike': {
      post: {
        tags: ['Likes & Dislikes'],
        summary: 'Dislike a poem',
        operationId: 'dislikePoem',
        security: [{ JWTAuth: [] }],
        parameters: [{ name: 'id', in: 'path', description: 'The ID of the poem to dislike', required: true, schema: { type: 'integer' } }],
        responses: {
          201: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/DislikeResponse' } } } },
          400: { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/user': {
      post: {
        tags: ['Users'],
        summary: 'Create a new user',
        operationId: 'createUser',
        requestBody: {
          description: 'The user to create',
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } }
        },
        responses: {
          201: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          400: { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { description: 'Internal Server Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users from the database',
        operationId: 'getUsers',
        responses: {
          200: {
            description: 'Success',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } }
          },
          500: { description: 'Internal Server Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        },
        deprecated: true
      }
    },
    '/user/{id}': {
      put: {
        tags: ['Users'],
        summary: 'Update a user in the database',
        operationId: 'updateUser',
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'The ID of the user to update',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          description: 'The user to update',
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } }
        },
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal Server Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user and associated poems from the database',
        operationId: 'deleteUser',
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'The ID of the user to delete',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          204: { $ref: '#/components/responses/NoContent' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { description: 'Internal Server Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      JWTAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      LoginInput: {
        type: 'object',
        properties: {
          email: { type: 'string', example: 'john@doe.com' },
          password: { type: 'string', example: 'password123' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'your_jwt_token_here' },
          message: { type: 'string', example: 'Login successful' }
        }
      },
      Poem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'John Doe' }
            }
          },
          content: {
            type: 'string',
            example:
              "In lines of code, we weave our art,\nA digital symphony from mind to chart.\nWith functions, loops, and logic clear,\nWe conquer problems, quelling fear.\n\nIn bytes and bits, our thoughts take flight,\nCreating programs that shine so bright.\nFrom bugs we learn, and errors mend,\nIn the world of code, there's no real end.\n\nSo, let us code with passion and grace,\nCreating software in this boundless space.\nWith every keystroke, we write our story,\nIn the language of machines, we find our glory."
          },
          created_at: { type: 'string', format: 'timestamp', example: '2020-07-01T00:00:00.000Z' },
          dislikes: { type: 'array', items: { type: 'integer' }, example: [] },
          likes: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
          title: { type: 'string', example: 'Coding Chronicles' }
        }
      },
      Author: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'John Doe' }
        }
      },
      PoemInput: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            example:
              "In lines of code, we weave our art,\nA digital symphony from mind to chart.\nWith functions, loops, and logic clear,\nWe conquer problems, quelling fear.\n\nIn bytes and bits, our thoughts take flight,\nCreating programs that shine so bright.\nFrom bugs we learn, and errors mend,\nIn the world of code, there's no real end.\n\nSo, let us code with passion and grace,\nCreating software in this boundless space.\nWith every keystroke, we write our story,\nIn the language of machines, we find our glory."
          },
          title: { type: 'string', example: 'Coding Chronicles' }
        }
      },
      PoemResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          message: { type: 'string' }
        }
      },
      LikeResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          message: { type: 'string' }
        }
      },
      DislikeResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          message: { type: 'string' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@doe.com' },
          created_at: { type: 'string', format: 'timestamp', example: '2022-01-01T00:00:00.000Z' }
        }
      },
      UserInput: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@doe.com' },
          password: { type: 'string', example: 'password123' }
        }
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          message: { type: 'string' }
        }
      },
      MessageResponse: {
        type: 'object',
        properties: {
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
  tags: [{ name: 'Authentication' }, { name: 'Poems' }, { name: 'Likes & Dislikes' }, { name: 'Users' }]
}

window.onload = function () {
  SwaggerUIBundle({
    spec: spec,
    dom_id: '#swagger-ui'
  })
}
