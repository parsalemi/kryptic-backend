import knex from '../knex.js';

function getUserById(id: string) {
  return knex('users').where('id', id).first();
}

function getUserByEmail(email: string) {
  return knex('users').where('email', email).first();
}

function getUserByUsername(username: string) {
  return knex('users').where('username', username).first();
}

export default {
  getUserById,
  getUserByEmail,
  getUserByUsername
}