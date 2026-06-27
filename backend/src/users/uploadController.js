const { randomUUID } = require('crypto');
const { getActiveStorageAdapter } = require('../storage/storageAdapterRegistry');

/**
 * Accepts a base64-encoded image and stores it via the active storage adapter.
 * body: { imageBase64, fileName? }
 * Returns a URL that tool endpoints (crop/resize/compress/etc.) can use as `imageUrl`.
 */
async function uploadImage(req, res) {
  try {
    const { imageBase64, fileName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'imageBase64 is required.' });
    }

    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    const base64Data = match ? match[2] : imageBase64;
    const mimeType = match ? match[1] : 'image/png';
    const ext = mimeType.split('/')[1] || 'png';

    const buffer = Buffer.from(base64Data, 'base64');
    const safeName = fileName
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `upload_${randomUUID()}.${ext}`;

    const adapter = await getActiveStorageAdapter();
    const url = await adapter.uploadFile(buffer, safeName);

    return res.status(200).json({ success: true, url });
  } catch (err) {
    console.error('uploadImage error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
}

module.exports = { uploadImage };
