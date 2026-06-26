const path = require('path');
const providerRegistry = require('./providerRegistry');

function resolveAdapterFile(provider) {
  const fileName =
    provider.adapter_file_name ||
    `${String(provider.provider_name).toLowerCase()}.adapter.js`;

  return path.join(__dirname, 'adapters', fileName);
}

/**
 * Execute fallback provider if primary fails.
 * @param {string} toolKey
 * @param {Object} inputData
 * @param {Object} options
 * @param {Error} originalError
 */
async function handleFallback(
  toolKey,
  inputData,
  options = {},
  originalError
) {
  try {
    const provider =
      await providerRegistry.getFallbackProvider(toolKey);

    if (!provider) {
      throw {
        success: false,
        message: 'All providers failed',
        toolKey,
        originalError: originalError?.message || originalError
      };
    }

    const AdapterClass = require(resolveAdapterFile(provider));
    const adapter = new AdapterClass();

    return await adapter.process(inputData, {
      ...options,
      provider
    });
  } catch (fallbackError) {
    console.error({
      toolKey,
      providerId: null,
      error: fallbackError.message || fallbackError,
      timestamp: new Date().toISOString()
    });

    throw {
      success: false,
      message: 'All providers failed',
      toolKey,
      originalError: originalError?.message || originalError
    };
  }
}

module.exports = {
  handleFallback
};
