'use strict';

import dotenv from 'dotenv';
dotenv.config();

const config = {
  jwt: {
    secret: '163ba8b12d2d47342e9d56054bb3f4eceb8b7aef0c7cc189f063e0370e7bc064',
    issuer: 'gulita',
    audience: 'urn:audience:test',
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || 'localhost',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },
  database: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
  },
};

export default config;
