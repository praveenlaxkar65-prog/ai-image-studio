const { supabase } = require('../db/dbConnect');

async function getNotifications(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', {
        ascending: false
      })
      .range(from, to);

    res.json({
      success: true,
      page,
      limit,
      total: count,
      notifications: data || []
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

async function markAsRead(req, res) {
  try {
    const { notificationId } = req.params;

    await supabase
      .from('notifications')
      .update({
        is_read: true
      })
      .eq('id', notificationId)
      .eq('user_id', req.user.id);

    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

module.exports = {
  getNotifications,
  markAsRead
};
