const fs = require('fs/promises');
const path = require('path');

// Resolved relative to this file's own location, so it no longer depends
// on which directory `npm run dev` was started from.
const UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'uploads');

async function uploadFile(fileBuffer, fileName) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const filePath = path.join(UPLOAD_DIR, fileName);
    await fs.writeFile(filePath, fileBuffer);

    // PUBLIC_BACKEND_URL should be set in .env to your backend's public URL
    // (e.g. the Codespace forwarded https:// URL for port 5000).
    const base = process.env.PUBLIC_BACKEND_URL || '';
    return `${base}/uploads/${fileName}`;
  } catch (err) {
    throw err;
  }
}

async function deleteFile(fileUrl) {
  try {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(UPLOAD_DIR, fileName);

    await fs.unlink(filePath);
    return true;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  uploadFile,
  deleteFile,
};
