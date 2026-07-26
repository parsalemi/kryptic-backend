import { User } from '../../models/user.model.js';
import knex from '../knex.js';

function getUserById(id: string): Promise<User> {
  return knex('users').where('id', id).first();
}

function getUserByEmail(email: string): Promise<User> {
  return knex('users').where('email', email).first();
}

function getUserByUsername(username: string): Promise<User> {
  return knex('users').where('username', username).first();
}

function registerUser(user: User) {
  return knex('users').insert(user);
}

function updateStatus(user: User, status: 'online' | 'offline' | 'busy' | 'away') {
  return knex('users').where('id', user.id).update({
    status: status,
    last_seen_at: knex.client.raw('NOW()'),
    updated_at: knex.client.raw('NOW()'),
  })
}

export default {
  getUserById,
  getUserByEmail,
  getUserByUsername,
  registerUser,
  updateStatus
}