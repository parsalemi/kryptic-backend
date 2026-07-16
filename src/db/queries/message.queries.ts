import knex from '../knex.js';

function getMessagesBetweenUsers(userId1: string, userId2: string, limit = 50) {
  return knex('messages').where(builder => {
    builder.where('sender_id', userId1).andWhere('receiver_id', userId2)
    .orWhere('sender_id', userId2).andWhere('receiver_id', userId1);
  }).where('is_deleted', false).orderBy('created_at', 'desc').limit(limit);
}

function getUnreadMessages(userId: string) {
  return knex('messages').where('receiver_id', userId).where('is_read', false)
  .where('is_deleted', false).orderBy('created_at', 'asc');
}

function markMessageAsRead(messageId: string) {
  return knex('messages').where('id', messageId).update({
    is_read: true,
    read_at: knex.fn.now()
  });
}

function cleanOldMessages() {
  return knex('messages').where('is_read', true)
  .where('read_at', '<', knex.raw("NOW() - INTERVAL '30 minutes'"))
  .where('is_deleted', false)
  .update({
    is_deleted: true,
    deleted_at: knex.fn.now()
  })
}

export default {
  getMessagesBetweenUsers,
  getUnreadMessages,
  markMessageAsRead
}