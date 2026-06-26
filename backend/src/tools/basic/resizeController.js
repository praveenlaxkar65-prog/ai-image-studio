// backend/src/tools/basic/resizeController.js
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

async function resizeImage(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      width,
      height,
      maintainAspectRatio = true
    } = req.body;

    if (!imageUrl || !width || !height) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl, width and height are required.'
      });
    }

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'resize_image')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Resize tool is not configured.'
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

    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return res.status(400).json({
        success: false,
        message: 'Unable to download source image.'
      });
    }

    const inputBuffer = Buffer.from(
      await imageResponse.arrayBuffer()
    );

    const outputBuffer = await sharp(inputBuffer)
      .resize(
        Number(width),
        Number(height),
        {
          fit: maintainAspectRatio
            ? 'inside'
            : 'fill'
        }
      )
      .png()
      .toBuffer();

    const adapter =
      await getActiveStorageAdapter();

    const storageConfig =
      await getStorageConfig();

    const fileName =
      `resize_${randomUUID()}.png`;

    const resultUrl =
      await adapter.uploadFile(
        outputBuffer,
        fileName,
        storageConfig
      );

    const idempotencyKey =
      `${userId}_resize_image_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'resize_image',
        idempotencyKey
      );

    return res.json({
      success: true,
      resultUrl,
      creditsDeducted: creditCost,
      newBalance: deduction.newBalance
    });

  } catch (error) {
    console.error('resizeImage:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Image resize failed.'
    });
  }
}

module.exports = {
  resizeImage
};
