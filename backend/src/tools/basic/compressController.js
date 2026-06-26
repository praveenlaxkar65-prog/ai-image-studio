// backend/src/tools/basic/compressController.js
// npm install sharp node-fetch

const sharp = require('sharp');
const fetch = require('node-fetch');
const { randomUUID } = require('crypto');

const { supabase } = require('../../db/dbConnect');
const {
  checkBalance,
  deductCredits
} = require('../../credits/creditService');

const {
  getActiveStorageAdapter,
  getStorageConfig
} = require('../../storage/storageAdapterRegistry');

async function compressImage(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      quality = 80,
      format = 'jpeg'
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required.'
      });
    }

    const allowedFormats = ['jpeg', 'png', 'webp'];

    if (!allowedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported output format.'
      });
    }

    const safeQuality = Math.max(
      1,
      Math.min(100, Number(quality))
    );

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'compress_image')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Compress tool is not configured.'
      });
    }

    const creditCost = Number(tool.credit_cost || 0);

    const balance = await checkBalance(
      userId,
      creditCost
    );

    if (!balance.sufficient) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient credits.',
        available: balance.currentBalance,
        required: creditCost
      });
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: 'Unable to download source image.'
      });
    }

    const inputBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    const originalSize = inputBuffer.length;

    let pipeline = sharp(inputBuffer);

    switch (format) {
      case 'png':
        pipeline = pipeline.png({
          quality: safeQuality
        });
        break;

      case 'webp':
        pipeline = pipeline.webp({
          quality: safeQuality
        });
        break;

      default:
        pipeline = pipeline.jpeg({
          quality: safeQuality
        });
        break;
    }

    const outputBuffer = await pipeline.toBuffer();

    const compressedSize = outputBuffer.length;

    const adapter =
      await getActiveStorageAdapter();

    const storageConfig =
      await getStorageConfig();

    const fileName =
      `compress_${randomUUID()}.${format}`;

    const resultUrl =
      await adapter.uploadFile(
        outputBuffer,
        fileName,
        storageConfig
      );

    const idempotencyKey =
      `${userId}_compress_image_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'compress_image',
        idempotencyKey
      );

    return res.json({
      success: true,
      resultUrl,
      creditsDeducted: creditCost,
      newBalance: deduction.newBalance,
      originalSize,
      compressedSize
    });

  } catch (error) {
    console.error('compressImage:', error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Image compression failed.'
    });
  }
}

module.exports = {
  compressImage
};
