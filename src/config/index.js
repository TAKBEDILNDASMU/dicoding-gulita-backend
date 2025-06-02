// src/config/index.js
'use strict';

// For simplicity, directly accessing process.env.
// In a larger app, you might use a library like 'dotenv' to load .env files,
// but since Node.js 20.6.0, you can use `node --env-file=.env your-script.js`
// For older versions or if you prefer, install dotenv: pnpm add dotenv
// import dotenv from 'dotenv';
// dotenv.config(); // Load .env file contents into process.env

const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || 'localhost',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },
  // Add other configurations like database credentials here
  // database: {
  //   uri: process.env.DB_URI,
  // }
};

export default config;
