const { supabase } = require('../db/dbConnect');

async function flagContent(projectId, flagType, reason) {
  try {
    const { data, error } = await supabase
      .from('moderation_flags')
      .insert({
        project_id: projectId,
        flag_type: flagType,
        flag_reason: reason,
        review_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    throw err;
  }
}

async function getReviewStatus(projectId) {
  try {
    const { data } = await supabase
      .from('moderation_flags')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data || null;
  } catch (err) {
    throw err;
  }
}

async function resolveFlag(
  flagId,
  decision,
  adminUserId
) {
  try {
    const { data, error } = await supabase
      .from('moderation_flags')
      .update({
        review_status: decision,
        reviewed_by: adminUserId
      })
      .eq('id', flagId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  flagContent,
  getReviewStatus,
  resolveFlag
};
