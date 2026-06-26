const crypto = require('crypto');
const { supabase } = require('../db/dbConnect');

function generateIdempotencyKey(userId, toolKey, timestamp) {
  return crypto
    .createHash('sha256')
    .update(`${userId}:${toolKey}:${timestamp}`)
    .digest('hex');
}

async function checkDuplicate(idempotencyKey) {
  try {
    const { data } = await supabase
      .from('transactions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    return !!data;
  } catch (err) {
    return false;
  }
}

module.exports = {
  generateIdempotencyKey,
  checkDuplicate
};
