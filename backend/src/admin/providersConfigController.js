const { supabase } = require('../db/dbConnect');
const { clearCache } = require('../config/configCache');

/**
 * Get all providers (admin view) - api_key_encrypted is masked in response
 */
async function getAllProviders(req, res) {
  try {
    const { data, error } = await supabase.from('providers').select('*').order('created_at', { ascending: false });

    if (error) throw error;

    const masked = data.map((p) => ({ ...p, api_key_encrypted: p.api_key_encrypted ? '••••••••' : null }));

    return res.status(200).json({ success: true, providers: masked });
  } catch (err) {
    console.error('getAllProviders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Create a new provider
 * body: { provider_name, api_key, endpoint_url, supported_features, supports_identity_preservation, cost_reference }
 */
async function createProvider(req, res) {
  try {
    const {
      provider_name,
      api_key,
      endpoint_url,
      supported_features = [],
      supports_identity_preservation = false,
      cost_reference = null,
    } = req.body;

    if (!provider_name || !endpoint_url) {
      return res.status(400).json({
        success: false,
        message: 'provider_name and endpoint_url are required',
      });
    }

    // NOTE: In production, api_key should be encrypted before storing.
    // Placeholder: encryption utility should be plugged in here (e.g. utils/encryption.js)
    const apiKeyEncrypted = api_key ? api_key : null;

    const { data, error } = await supabase
      .from('providers')
      .insert([
        {
          provider_name,
          api_key_encrypted: apiKeyEncrypted,
          endpoint_url,
          supported_features,
          supports_identity_preservation,
          status: 'active',
          cost_reference,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, provider: { ...data, api_key_encrypted: '••••••••' } });
  } catch (err) {
    console.error('createProvider error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Update an existing provider
 * body: any subset of provider fields
 */
async function updateProvider(req, res) {
  try {
    const { providerId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No update fields provided' });
    }

    // If api_key is being updated, treat as raw key needing encryption (placeholder)
    if (updates.api_key) {
      updates.api_key_encrypted = updates.api_key;
      delete updates.api_key;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('providers')
      .update(updates)
      .eq('id', providerId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Provider not found or update failed' });
    }

    // Provider details changed - clear all tool->provider cache entries (broad invalidation)
    clearCache(`provider_${providerId}`);

    return res.status(200).json({ success: true, provider: { ...data, api_key_encrypted: '••••••••' } });
  } catch (err) {
    console.error('updateProvider error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Delete a provider
 */
async function deleteProvider(req, res) {
  try {
    const { providerId } = req.params;

    const { error } = await supabase.from('providers').delete().eq('id', providerId);

    if (error) throw error;

    clearCache(`provider_${providerId}`);

    return res.status(200).json({ success: true, message: 'Provider deleted' });
  } catch (err) {
    console.error('deleteProvider error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Test connection / health-check for a provider
 */
async function testProviderConnection(req, res) {
  try {
    const { providerId } = req.params;

    const { data: provider, error } = await supabase.from('providers').select('*').eq('id', providerId).single();

    if (error || !provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    // Dynamically load adapter and call healthCheck (template pattern)
    try {
      const adapterFileName = provider.provider_name.toLowerCase().replace(/\s+/g, '_');
      const adapter = require(`../providers/adapters/${adapterFileName}.adapter.js`);
      const isHealthy = await adapter.healthCheck(provider);
      return res.status(200).json({ success: true, healthy: isHealthy });
    } catch (adapterErr) {
      return res.status(200).json({ success: true, healthy: false, message: 'Adapter not found or health-check failed' });
    }
  } catch (err) {
    console.error('testProviderConnection error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = {
  getAllProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  testProviderConnection,
};
