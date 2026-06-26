const { supabase } = require('../db/dbConnect');
const { clearCache } = require('../config/configCache');

/**
 * Get all tools with their config (admin view)
 */
async function getAllTools(req, res) {
  try {
    const { data, error } = await supabase
      .from('tools_config')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ success: true, tools: data });
  } catch (err) {
    console.error('getAllTools error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Get single tool config by tool_key
 */
async function getToolByKey(req, res) {
  try {
    const { toolKey } = req.params;

    const { data, error } = await supabase
      .from('tools_config')
      .select('*')
      .eq('tool_key', toolKey)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    return res.status(200).json({ success: true, tool: data });
  } catch (err) {
    console.error('getToolByKey error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Create a new tool config entry
 * body: { tool_key, tool_name, category, is_active, is_free, credit_cost, assigned_provider_id, fallback_provider_id }
 */
async function createTool(req, res) {
  try {
    const {
      tool_key,
      tool_name,
      category,
      is_active = true,
      is_free = false,
      credit_cost = 0,
      assigned_provider_id = null,
      fallback_provider_id = null,
    } = req.body;

    if (!tool_key || !tool_name || !category) {
      return res.status(400).json({
        success: false,
        message: 'tool_key, tool_name and category are required',
      });
    }

    const { data, error } = await supabase
      .from('tools_config')
      .insert([
        {
          tool_key,
          tool_name,
          category,
          is_active,
          is_free,
          credit_cost,
          assigned_provider_id,
          fallback_provider_id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, tool: data });
  } catch (err) {
    console.error('createTool error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Update an existing tool config (toggle active, change pricing/provider etc.)
 * body: any subset of tool fields
 */
async function updateTool(req, res) {
  try {
    const { toolKey } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No update fields provided' });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tools_config')
      .update(updates)
      .eq('tool_key', toolKey)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Tool not found or update failed' });
    }

    // Invalidate any cached config related to this tool
    clearCache(`provider_for_tool_${toolKey}`);

    return res.status(200).json({ success: true, tool: data });
  } catch (err) {
    console.error('updateTool error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Delete a tool config entry
 */
async function deleteTool(req, res) {
  try {
    const { toolKey } = req.params;

    const { error } = await supabase.from('tools_config').delete().eq('tool_key', toolKey);

    if (error) throw error;

    clearCache(`provider_for_tool_${toolKey}`);

    return res.status(200).json({ success: true, message: 'Tool deleted' });
  } catch (err) {
    console.error('deleteTool error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = {
  getAllTools,
  getToolByKey,
  createTool,
  updateTool,
  deleteTool,
};
