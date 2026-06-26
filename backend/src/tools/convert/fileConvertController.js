const sharp = require('sharp');
const fetch = require('node-fetch');
const { supabase } = require('../../db/dbConnect');
const { checkBalance, deductCredits } = require('../../credits/creditService');
const { getActiveStorageAdapter } = require('../../storage/storageAdapterRegistry');

/**
 * Convert an image from one format to another (PNG, JPEG, WebP, AVIF)
 * body: { imageUrl, targetFormat, quality }
 */
async function convertFile(req, res) {
  try {
    const userId = req.user.id;
    const { imageUrl, targetFormat, quality = 90 } = req.body;

    const allowedFormats = ['png', 'jpeg', 'webp', 'avif'];

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }
    if (!targetFormat || !allowedFormats.includes(targetFormat.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `targetFormat must be one of: ${allowedFormats.join(', ')}`,
      });
    }

    const { data: toolConfig, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'file_conversion')
      .single();

    if (toolError || !toolConfig) {
      return res.status(500).json({ success: false, message: 'Tool configuration not found' });
    }

    const requiredCredits = toolConfig.credit_cost;

    const balanceCheck = await checkBalance(userId, requiredCredits);
    if (!balanceCheck.sufficient) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient credits',
        required: requiredCredits,
        available: balanceCheck.currentBalance,
      });
    }

    // Fetch original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'Failed to fetch source image' });
    }
    const inputBuffer = await response.buffer();

    const format = targetFormat.toLowerCase();
    const clampedQuality = Math.min(100, Math.max(1, quality));

    let sharpInstance = sharp(inputBuffer);

    switch (format) {
      case 'png':
        sharpInstance = sharpInstance.png({ quality: clampedQuality });
        break;
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: clampedQuality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: clampedQuality });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ quality: clampedQuality });
        break;
      default:
        return res.status(400).json({ success: false, message: 'Unsupported format' });
    }

    const outputBuffer = await sharpInstance.toBuffer();

    const storageAdapter = getActiveStorageAdapter();
    const fileName = `converted_${userId}_${Date.now()}.${format}`;
    const resultUrl = await storageAdapter.uploadFile(outputBuffer, fileName, {});

    const idempotencyKey = `${userId}_file_conversion_${Date.now()}`;
    const deductResult = await deductCredits(userId, requiredCredits, 'file_conversion', idempotencyKey);

    return res.status(200).json({
      success: true,
      resultUrl,
      creditsDeducted: requiredCredits,
      newBalance: deductResult.newBalance,
      originalFormat: response.headers.get('content-type') || 'unknown',
      convertedFormat: format,
    });
  } catch (err) {
    console.error('convertFile error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = { convertFile };
