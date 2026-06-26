const { getCachedSetting } = require('../config/configCache');

async function getStorageConfig() {
  try {
    return (await getCachedSetting('storage_config')) || {};
  } catch (err) {
    throw err;
  }
}

async function getActiveStorageAdapter() {
  try {
    const provider =
      (await getCachedSetting('storage_provider')) || 'local';

    switch (String(provider).toLowerCase()) {
      case 's3':
        return require('./adapters/s3.adapter');
      case 'r2':
        return require('./adapters/r2.adapter');
      default:
        return require('./adapters/local.adapter');
    }
  } catch (err) {
    throw err;
  }
}

module.exports = {
  getActiveStorageAdapter,
  getStorageConfig
};
