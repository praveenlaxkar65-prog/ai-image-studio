const { supabase } = require('../db/dbConnect');

/**
 * Get single setting value from system_settings table.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function getSetting(key) {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data.setting_value;
  } catch (err) {
    console.error('configLoader.getSetting', err);
    return null;
  }
}

/**
 * Fetch all settings and return as object.
 * @returns {Promise<Object>}
 */
async function getAllSettings() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value');

    if (error || !Array.isArray(data)) {
      return {};
    }

    return data.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
  } catch (err) {
    console.error('configLoader.getAllSettings', err);
    return {};
  }
}

module.exports = {
  getSetting,
  getAllSettings
};
