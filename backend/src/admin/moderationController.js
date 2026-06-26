const { supabase } = require('../db/dbConnect');

/**
 * Get all moderation flags (with optional status filter)
 * query: { status (pending/approved/rejected), page, limit }
 */
async function getModerationQueue(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('moderation_flags')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('review_status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return res.status(200).json({ success: true, flags: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('getModerationQueue error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Get single flag detail with related project info
 */
async function getFlagDetail(req, res) {
  try {
    const { flagId } = req.params;

    const { data: flag, error } = await supabase.from('moderation_flags').select('*').eq('id', flagId).single();

    if (error || !flag) {
      return res.status(404).json({ success: false, message: 'Flag not found' });
    }

    const { data: project } = await supabase.from('projects').select('*').eq('id', flag.project_id).single();

    return res.status(200).json({ success: true, flag, project: project || null });
  } catch (err) {
    console.error('getFlagDetail error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Admin resolves a flag - approve or reject
 * body: { decision ('approved' | 'rejected') }
 */
async function resolveFlag(req, res) {
  try {
    const { flagId } = req.params;
    const { decision } = req.body;
    const adminUserId = req.user.id;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: "decision must be 'approved' or 'rejected'" });
    }

    const { data, error } = await supabase
      .from('moderation_flags')
      .update({ review_status: decision, reviewed_by: adminUserId })
      .eq('id', flagId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Flag not found or update failed' });
    }

    return res.status(200).json({ success: true, flag: data });
  } catch (err) {
    console.error('resolveFlag error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Update moderation toggle settings (NSFW sensitivity, deepfake/copyright on-off)
 * body: { nsfw_enabled, nsfw_sensitivity, deepfake_enabled, copyright_enabled }
 */
async function updateModerationSettings(req, res) {
  try {
    const { supabase: db } = require('../db/dbConnect'); // local alias avoid confusion
    const { clearCache } = require('../config/configCache');
    const settings = req.body;

    if (!settings || Object.keys(settings).length === 0) {
      return res.status(400).json({ success: false, message: 'No settings provided' });
    }

    const { error } = await db
      .from('system_settings')
      .upsert(
        { setting_key: 'moderation_settings', setting_value: settings, updated_at: new Date().toISOString() },
        { onConflict: 'setting_key' }
      );

    if (error) throw error;

    clearCache('moderation_settings');

    return res.status(200).json({ success: true, moderation_settings: settings });
  } catch (err) {
    console.error('updateModerationSettings error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = {
  getModerationQueue,
  getFlagDetail,
  resolveFlag,
  updateModerationSettings,
};
