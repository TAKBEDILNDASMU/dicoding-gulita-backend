// src/api/users/userValidation.js
'use strict';

import Joi from '@hapi/joi';

export const registerPayloadSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.base': `"username" should be a type of 'text'`,
    'string.alphanum': `"username" must only contain alpha-numeric characters`,
    'string.min': `"username" should have a minimum length of {#limit}`,
    'string.max': `"username" should have a maximum length of {#limit}`,
    'any.required': `"username" is a required field`,
  }),
  email: Joi.string().email().required().messages({
    'string.email': `"email" must be a valid email`,
    'any.required': `"email" is a required field`,
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': `"password" should have a minimum length of {#limit}`,
    'any.required': `"password" is a required field`,
  }),
});

// You might add schemas for login, updateUser, etc. here
