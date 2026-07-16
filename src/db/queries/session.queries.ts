import knex from '../knex.js';

function getActiveSessions(userId: string) {
  return knex('sessions').where('user_id', userId).where('is_revoked', false)
  .where('expires_at', '>', knex.raw("NOW() - INTERVAL '30 minutes'"));
}

export default {
  getActiveSessions
}