const { supabase } = require('../db/dbConnect');
const { clearCache } = require('../config/configCache');

/**
 * Get all system settings (general/global settings not covered by other admin controllers)
 */
async function getAllSettings(req, res) {
  try {
    const { data, error } = await supabase.from('system_settings').select('*');

    if (error) throw error;

    const settings = {};
    data.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return res.status(200).json({ success: true, settings });
  } catch (err) {
    console.error('getAllSettings error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Generic setting update - for any setting_key not covered by a dedicated endpoint
 * body: { key, value }
 */
async function updateSetting(req, res) {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ success: false, message: 'Setting key is required' });
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });

    if (error) throw error;

    clearCache(key);

    return res.status(200).json({ success: true, key, value });
  } catch (err) {
    console.error('updateSetting error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Update general site settings (logo, site name, terms/policy pages)
 * body: { siteName, logoUrl, termsUrl, policyUrl }
 */
async function updateGeneralSettings(req, res) {
  try {
    const settings = req.body;

    if (!settings || Object.keys(settings).length === 0) {
      return res.status(400).json({ success: false, message: 'No settings provided' });
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert(
        { setting_key: 'general_site_settings', setting_value: settings, updated_at: new Date().toISOString() },
        { onConflict: 'setting_key' }
      );

    if (error) throw error;

    clearCache('general_site_settings');

    return res.status(200).json({ success: true, general_site_settings: settings });
  } catch (err) {
    console.error('updateGeneralSettings error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = {
  getAllSettings,
  updateSetting,
  updateGeneralSettings,
};
