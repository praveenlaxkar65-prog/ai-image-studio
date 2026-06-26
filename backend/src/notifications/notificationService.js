/**
 * Migration add karni hogi:
 * notifications (
 * id,
 * user_id,
 * message,
 * type,
 * is_read,
 * created_at
 * )
 */

const { supabase } = require('../db/dbConnect');

async function createNotification(
  userId,
  message,
  type
) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message,
        type
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    throw err;
  }
}

async function notifyJobUpdate(
  userId,
  jobId,
  status
) {
  try {
    const messages = {
      completed:
        'Your image processing job is complete!',
      failed:
        'Job failed, credits refunded.',
      step_completed:
        `Job ${jobId} processed a step successfully.`
    };

    return createNotification(
      userId,
      messages[status] || `Job ${jobId} updated.`,
      status
    );
  } catch (err) {
    throw err;
  }
}

async function getUnreadNotifications(userId) {
  try {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', {
        ascending: false
      });

    return data || [];
  } catch (err) {
    throw err;
  }
}

module.exports = {
  createNotification,
  notifyJobUpdate,
  getUnreadNotifications
};
