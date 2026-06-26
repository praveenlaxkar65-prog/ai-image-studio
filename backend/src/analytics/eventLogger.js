const { supabase } = require('../db/dbConnect');

async function logEvent(userId, eventType, eventData = {}) {
  try {
    const { error } = await supabase
      .from('analytics_logs')
      .insert({
        user_id: userId || null,
        event_type: eventType,
        event_data: eventData
      });

    if (error) throw error;

    return true;
  } catch (err) {
    console.error('logEvent', err);
    return false;
  }
}

async function logToolUsage(
  userId,
  toolKey,
  creditsCost,
  status
) {
  return logEvent(userId, 'tool_usage', {
    toolKey,
    creditsCost,
    status
  });
}

async function logSignup(userId) {
  return logEvent(userId, 'signup', {});
}

async function logLogin(userId) {
  return logEvent(userId, 'login', {});
}

module.exports = {
  logEvent,
  logToolUsage,
  logSignup,
  logLogin
};
