const crypto = require('crypto');

// Zero-hardcode: encryption key/IV come from env, never fixed in code
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default_dev_key_change_in_env_32chars!!'; // fallback for dev only

/**
 * Encrypt a plain text string (e.g. provider API keys before DB storage)
 */
function encrypt(text) {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a previously encrypted string
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random secure token (e.g. for idempotency keys, reset tokens)
 */
function generateRandomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = { encrypt, decrypt, generateRandomToken };
