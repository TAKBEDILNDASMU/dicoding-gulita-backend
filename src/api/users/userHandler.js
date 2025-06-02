'use strict';

import * as userService from '../../services/userService.js';

export const registerUserHandler = async (request, h) => {
  try {
    const { username, email, password } = request.payload;
    const newUser = await userService.createUser({ username, email, password });

    return h
      .response({
        message: 'User registered successfully!',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      })
      .code(201); // 201 Created
  } catch (err) {
    console.error('Registration Handler Error:', err.message);
    if (err.statusCode) {
      return h.response({ message: err.message }).code(err.statusCode);
    }
    // Generic server error for unexpected issues
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

// You can add other handlers like loginUserHandler, getUserProfileHandler etc.
