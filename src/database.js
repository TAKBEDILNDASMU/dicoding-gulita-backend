import pg from 'pg';
import dotenv from 'dotenv';
import config from './config/index.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool(config.database);

pool.on('connect', () => {
  console.log('Connected to local PostgreSQL database!');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);

export default pool;
