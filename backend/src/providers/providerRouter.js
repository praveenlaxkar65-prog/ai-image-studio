const path = require('path');
const providerRegistry = require('./providerRegistry');
const fallbackHandler = require('./fallbackHandler');

function resolveAdapterFile(provider) {
  const fileName =
    provider.adapter_file_name ||
    `${String(provider.provider_name).toLowerCase()}.adapter.js`;

  return path.join(__dirname, 'adapters', fileName);
}

/**
 * Route request to assigned provider.
 * @param {string} toolKey
 * @param {Object} inputData
 * @param {Object} options
 */
async function routeToProvider(toolKey, inputData, options = {}) {
  let provider = null;

  try {
    provider = await providerRegistry.getProviderForTool(toolKey);

    if (!provider) {
      throw new Error('Primary provider not configured');
    }

    const AdapterClass = require(resolveAdapterFile(provider));
    const adapter = new AdapterClass();

    return await adapter.process(inputData, {
      ...options,
      provider
    });
  } catch (error) {
    console.error({
      toolKey,
      providerId: provider?.id || null,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return fallbackHandler.handleFallback(
      toolKey,
      inputData,
      options,
      error
    );
  }
}

module.exports = {
  routeToProvider
};
