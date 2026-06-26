const { supabase } = require('../db/dbConnect');
const { clearCache } = require('../config/configCache');

/**
 * Get current storage settings (provider, auto-delete timer, bucket config)
 */
async function getStorageSettings(req, res) {
  try {
    const keys = ['storage_provider', 'storage_config', 'auto_delete_hours', 'permanent_storage_limit_gb'];

    const { data, error } = await supabase.from('system_settings').select('*').in('setting_key', keys);

    if (error) throw error;

    const settings = {};
    data.forEach((row) => {
      // Mask sensitive keys/secrets inside storage_config before sending to frontend
      if (row.setting_key === 'storage_config' && row.setting_value) {
        const masked = { ...row.setting_value };
        if (masked.accessKey) masked.accessKey = '••••••••';
        if (masked.secretKey) masked.secretKey = '••••••••';
        settings[row.setting_key] = masked;
      } else {
        settings[row.setting_key] = row.setting_value;
      }
    });

    return res.status(200).json({ success: true, settings });
  } catch (err) {
    console.error('getStorageSettings error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Update which storage provider is active ('s3' | 'r2' | 'local')
 * body: { provider }
 */
async function updateStorageProvider(req, res) {
  try {
    const { provider } = req.body;
    const allowed = ['s3', 'r2', 'local'];

    if (!provider || !allowed.includes(provider)) {
      return res.status(400).json({ success: false, message: `provider must be one of: ${allowed.join(', ')}` });
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert(
        { setting_key: 'storage_provider', setting_value: provider, updated_at: new Date().toISOString() },
        { onConflict: 'setting_key' }
      );

    if (error) throw error;

    clearCache('storage_provider');

    return res.status(200).json({ success: true, storage_provider: provider });
  } catch (err) {
    console.error('updateStorageProvider error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Update storage connection config (keys/bucket-name etc.) for the active provider
 * body: { accessKey, secretKey, bucketName, region, endpoint }
 */
async function updateStorageConfig(req, res) {
  try {
    const config = req.body;

    if (!config || Object.keys(config).length === 0) {
      return res.status(400).json({ success: false, message: 'Storage config payload is required' });
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert(
        { setting_key: 'storage_config', setting_value: config, updated_at: new Date().toISOString() },
        { onConflict: 'setting_key' }
      );

    if (error) throw error;

    clearCache('storage_config');

    return res.status(200).json({ success: true, message: 'Storage config updated' });
  } catch (err) {
    console.error('updateStorageConfig error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Update auto-delete timer (in hours) for temporary storage
 * body: { hours }
 */
async function updateAutoDeleteTimer(req, res) {
  try {
    const { hours } = req.body;

    if (hours === undefined || hours <= 0) {
      return res.status(400).json({ success: false, message: 'Valid hours value is required' });
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert(
        { setting_key: 'auto_delete_hours', setting_value: hours, updated_at: new Date().toISOString() },
        { onConflict: 'setting_key' }
      );

    if (error) throw error;

    clearCache('auto_delete_hours');

    return res.status(200).json({ success: true, auto_delete_hours: hours });
  } catch (err) {
    console.error('updateAutoDeleteTimer error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = {
  getStorageSettings,
  updateStorageProvider,
  updateStorageConfig,
  updateAutoDeleteTimer,
};
