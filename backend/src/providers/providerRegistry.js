const { supabase } = require('../db/dbConnect');
const cache = require('../config/configCache');

/**
 * Fetch provider record using provider id.
 * @param {string|number} providerId
 * @returns {Promise<Object|null>}
 */
async function fetchProvider(providerId) {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', providerId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getProviderByField(toolKey, fieldName, cachePrefix) {
  try {
    const cacheKey = `${cachePrefix}_${toolKey}`;

    const cached = cache.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('tools_config')
      .select(fieldName)
      .eq('tool_key', toolKey)
      .maybeSingle();

    if (error || !data || !data[fieldName]) {
      return null;
    }

    const provider = await fetchProvider(data[fieldName]);

    if (provider) {
      cache.setCache(cacheKey, provider);
    }

    return provider;
  } catch (err) {
    console.error('providerRegistry', err);
    return null;
  }
}

/**
 * Get primary provider assigned to tool.
 * @param {string} toolKey
 */
async function getProviderForTool(toolKey) {
  return getProviderByField(
    toolKey,
    'assigned_provider_id',
    'provider_for_tool'
  );
}

/**
 * Get fallback provider assigned to tool.
 * @param {string} toolKey
 */
async function getFallbackProvider(toolKey) {
  return getProviderByField(
    toolKey,
    'fallback_provider_id',
    'fallback_provider_for_tool'
  );
}

module.exports = {
  getProviderForTool,
  getFallbackProvider
};
