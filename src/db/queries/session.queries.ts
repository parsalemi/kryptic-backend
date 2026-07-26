import { Session } from '../../models/session.model.js';
import knex from '../knex.js';

function getActiveSessions(userId: string) {
  return knex('sessions').where('user_id', userId).where('is_revoked', false)
  .where('expires_at', '>', knex.raw("NOW() - INTERVAL '30 minutes'"));
}

function isSessionExistsAndValid(refreshToken: string) {
  return knex('sessions').where('refresh_token', refreshToken)
  .where('is_rewoked', false).where('expires_at', '>', knex.client.raw('NOW()')).first();
}

function insertSession(session: Session) {
  return knex('sessions').insert(session);
}

function revokeSession(refreshToken: string) {
  return knex('sessions').where('refresh_token', refreshToken).update({
    is_revoked: true,
    updated_at: knex.fn.now()
  })
}

export default {
  getActiveSessions,
  insertSession,
  isSessionExistsAndValid,
  revokeSession
}