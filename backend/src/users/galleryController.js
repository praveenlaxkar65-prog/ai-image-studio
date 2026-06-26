const { supabase } = require('../db/dbConnect');
const { getActiveStorageAdapter } = require('../storage/storageAdapterRegistry');

/**
 * Get all saved projects/images for current user (paginated)
 * query: { page, limit }
 */
async function getGallery(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.status(200).json({ success: true, projects: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('getGallery error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Get single project detail (ownership-checked)
 */
async function getProjectDetail(req, res) {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    return res.status(200).json({ success: true, project: data });
  } catch (err) {
    console.error('getProjectDetail error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Save a result to gallery permanently (sets is_permanent true - may require paid plan, that check
 * can be added at route/middleware level later)
 */
async function saveToGallery(req, res) {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const { data, error } = await supabase
      .from('projects')
      .update({ is_permanent: true })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Project not found or update failed' });
    }

    return res.status(200).json({ success: true, project: data });
  } catch (err) {
    console.error('saveToGallery error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Delete a project (removes file from storage + DB row), ownership-checked
 */
async function deleteProject(req, res) {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    try {
      const storageAdapter = getActiveStorageAdapter();
      await storageAdapter.deleteFile(project.file_url, {});
    } catch (storageErr) {
      console.error('Storage delete warning:', storageErr.message);
      // Continue even if storage delete fails - DB cleanup still proceeds
    }

    const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('deleteProject error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = {
  getGallery,
  getProjectDetail,
  saveToGallery,
  deleteProject,
};
