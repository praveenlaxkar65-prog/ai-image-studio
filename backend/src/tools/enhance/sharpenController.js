// backend/src/tools/enhance/sharpenController.js
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

async function sharpenImage(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      intensity = 5
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required.'
      });
    }

    const safeIntensity = clamp(intensity, 1, 10);

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'sharpen_image')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Sharpen tool is not configured.'
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

    const outputBuffer = await sharp(inputBuffer)
      .sharpen({
        sigma: safeIntensity / 2
      })
      .png()
      .toBuffer();

    const adapter =
      await getActiveStorageAdapter();

    const storageConfig =
      await getStorageConfig();

    const fileName =
      `sharpen_${randomUUID()}.png`;

    const resultUrl =
      await adapter.uploadFile(
        outputBuffer,
        fileName,
        storageConfig
      );

    const idempotencyKey =
      `${userId}_sharpen_image_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'sharpen_image',
        idempotencyKey
      );

    return res.json({
      success: true,
      resultUrl,
      creditsDeducted: creditCost,
      newBalance: deduction.newBalance
    });

  } catch (error) {
    console.error(
      'sharpenImage:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Image sharpening failed.'
    });
  }
}

module.exports = {
  sharpenImage
};
