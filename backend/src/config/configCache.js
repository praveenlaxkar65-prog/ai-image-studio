const configLoader = require('./configLoader');

const CACHE_TTL_MS = 5 * 60 * 1000;
const cacheStore = new Map();

/**
 * Get cached setting value.
 * If cache expired/missing, fetch from DB and cache it.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function getCachedSetting(key) {
  const cached = cacheStore.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await configLoader.getSetting(key);

  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });

  return value;
}

/**
 * Store arbitrary value in cache.
 * Useful for provider registry caching.
 * @param {string} key
 * @param {any} value
 */
function setCache(key, value) {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

/**
 * Read raw cache entry.
 * @param {string} key
 * @returns {any|null}
 */
function getCache(key) {
  const cached = cacheStore.get(key);

  if (!cached || cached.expiresAt <= Date.now()) {
    return null;
  }

  return cached.value;
}

/**
 * Clear cache entry or entire cache.
 * @param {string} [key]
 */
function clearCache(key) {
  if (!key) {
    cacheStore.clear();
    return;
  }

  cacheStore.delete(key);
}

module.exports = {
  getCachedSetting,
  setCache,
  getCache,
  clearCache
};
