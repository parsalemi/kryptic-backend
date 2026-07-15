import dotenv from 'dotenv';
import knex from 'knex';

type Knex = knex.Knex.Config;

dotenv.config({path: `.env.${process.env['NODE_ENV'] || 'development'}`});


const development: Knex = {
  client: 'postgresql',
  connection: {
    host: process.env['DB_HOST']!,
    port: parseInt(process.env['DB_PORT']!),
    database: process.env['DB_NAME']!,
    user: process.env['DB_USER']!,
    password: process.env['DB_PASSWORD']!
  },
  pool: {
    min: parseInt(process.env['DB_POOL_MIN']!),
    max: parseInt(process.env['DB_POOL_MAX']!),
  },
  migrations: {
    directory: './src/db/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/db/seeds'
  }
}

const production: Knex = {
  client: 'postgresql',
  connection: {
    host: process.env['DB_HOST']!,
    port: parseInt(process.env['DB_PORT']!),
    database: process.env['DB_NAME']!,
    user: process.env['DB_USER']!,
    password: process.env['DB_PASSWORD']!,
  },
  pool: {
    min: parseInt(process.env['DB_POOL_MIN']!),
    max: parseInt(process.env['DB_POOL_MAX']!),
  },
  migrations: {
    directory: './dist/db/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './dist/db/seeds'
  }
}

export default {development, production};
