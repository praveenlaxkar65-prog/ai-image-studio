// backend/src/tools/basic/cropController.js
// npm install sharp node-fetch

const sharp = require('sharp');
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

async function cropImage(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      x,
      y,
      width,
      height
    } = req.body;

    // Input validation
    if (
      !imageUrl ||
      [x, y, width, height].some(
        value => value === undefined || Number.isNaN(Number(value))
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl, x, y, width and height are required.'
      });
    }

    if (Number(width) <= 0 || Number(height) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Width and height must be greater than zero.'
      });
    }

    // Load tool configuration dynamically
    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'crop_image')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Crop tool is not configured.'
      });
    }

    const creditCost = Number(tool.credit_cost || 0);

    // Credit validation
    const balance = await checkBalance(userId, creditCost);

    if (!balance.sufficient) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient credits.',
        available: balance.currentBalance,
        required: creditCost
      });
    }

    // Download source image
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: 'Unable to download source image.'
      });
    }

    const inputBuffer = Buffer.from(await response.arrayBuffer());

    // Crop image
    const outputBuffer = await sharp(inputBuffer)
      .extract({
        left: Number(x),
        top: Number(y),
        width: Number(width),
        height: Number(height)
      })
      .png()
      .toBuffer();

    // Upload processed image
    const adapter = await getActiveStorageAdapter();
    const storageConfig = await getStorageConfig();

    const fileName = `crop_${randomUUID()}.png`;

    const uploadResult = await adapter.uploadFile(
      outputBuffer,
      fileName,
      storageConfig
    );

    // Support multiple adapter return formats
    const resultUrl =
      uploadResult?.url ||
      uploadResult?.publicUrl ||
      uploadResult;

    if (!resultUrl) {
      throw new Error('Storage adapter did not return file URL.');
    }

    // Deduct credits (idempotent)
    const idempotencyKey =
      req.headers['x-request-id'] ||
      `${userId}_crop_image_${randomUUID()}`;

    const deduction = await deductCredits(
      userId,
      creditCost,
      'crop_image',
      idempotencyKey
    );

    return res.status(200).json({
      success: true,
      resultUrl,
      creditsDeducted: creditCost,
      newBalance: deduction.newBalance
    });

  } catch (error) {
    console.error('cropImage:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Image crop failed.'
    });
  }
}

module.exports = {
  cropImage
};