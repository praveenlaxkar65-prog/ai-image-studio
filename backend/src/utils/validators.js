/**
 * Common reusable validation helpers used across controllers
 */

function isValidEmail(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function isValidUUID(value) {
  if (!value) return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(value);
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\/.+/.test(url);
}

function clampNumber(value, min, max) {
  const num = Number(value);
  if (isNaN(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function sanitizeObject(obj, allowedKeys) {
  const result = {};
  allowedKeys.forEach((key) => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  return result;
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUUID,
  isValidImageUrl,
  clampNumber,
  isNonEmptyString,
  sanitizeObject,
};
