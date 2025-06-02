'use strict';

import { registerUserHandler } from './userHandler.js';
import { registerPayloadSchema } from './userValidation.js';

const userRoutes = [
  {
    method: 'POST',
    path: '/users/register', // More RESTful path: /users
    options: {
      description: 'Register a new user',
      tags: ['api', 'users'], // Useful for swagger documentation
      validate: {
        payload: registerPayloadSchema,
        failAction: (request, h, err) => {
          // Log the detailed error for server-side debugging
          console.error('Validation Error:', err.details);
          // Re-throw the error to let Hapi handle sending the 400 response
          // Or, customize the response:
          // return h.response({
          //   statusCode: 400,
          //   error: "Bad Request",
          //   message: "Invalid request payload input",
          //   validationErrors: err.details.map(d => ({ field: d.path.join('.'), message: d.message }))
          // }).code(400).takeover();
          throw err;
        },
      },
      // auth: false, // Explicitly state if auth is not required for this route
    },
    handler: registerUserHandler,
  },
  // Add other user routes here (e.g., login, get profile)
  // {
  //   method: 'POST',
  //   path: '/users/login',
  //   handler: loginUserHandler,
  //   options: { ... }
  // }
];

export default userRoutes;
