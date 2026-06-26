// backend/src/tools/enhance/colorCorrectionController.js
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

async function correctColor(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      brightness = 0,
      contrast = 0,
      saturation = 0,
      autoEnhance = false
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required.'
      });
    }

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'color_correction')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Color correction tool is not configured.'
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

    let pipeline = sharp(inputBuffer);

    if (autoEnhance) {

      // Automatically stretches histogram
      // and improves overall tonal range.
      pipeline = pipeline.normalize();

    } else {

      const safeBrightness = clamp(
        brightness,
        -100,
        100
      );

      const safeContrast = clamp(
        contrast,
        -100,
        100
      );

      const safeSaturation = clamp(
        saturation,
        -100,
        100
      );

      /**
       * Conversion Logic
       *
       * UI Range:
       * -100 .......... 0 .......... +100
       *
       * Sharp expects:
       * brightness : 0..2
       * saturation : 0..2
       *
       * Formula:
       * multiplier = 1 + (value / 100)
       *
       * Examples:
       * -100 => 0
       * 0    => 1
       * +100 => 2
       */

      const brightnessMultiplier =
        Math.max(
          0,
          1 + safeBrightness / 100
        );

      const saturationMultiplier =
        Math.max(
          0,
          1 + safeSaturation / 100
        );

      pipeline = pipeline.modulate({
        brightness: brightnessMultiplier,
        saturation: saturationMultiplier
      });

      /**
       * Contrast Conversion
       *
       * Sharp.linear(a,b)
       *
       * a = pixel multiplier
       *
       * Formula:
       * a = 1 + (contrast / 100)
       *
       * Examples:
       * -100 => 0
       * 0    => 1
       * +100 => 2
       *
       * b kept as 0.
       */

      const contrastMultiplier =
        Math.max(
          0,
          1 + safeContrast / 100
        );

      pipeline = pipeline.linear(
        contrastMultiplier,
        0
      );
    }

    const outputBuffer = await pipeline
      .png()
      .toBuffer();

    const adapter =
      await getActiveStorageAdapter();

    const storageConfig =
      await getStorageConfig();

    const fileName =
      `color_correction_${randomUUID()}.png`;

    const resultUrl =
      await adapter.uploadFile(
        outputBuffer,
        fileName,
        storageConfig
      );

    const idempotencyKey =
      `${userId}_color_correction_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'color_correction',
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
      'correctColor:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Color correction failed.'
    });
  }
}

module.exports = {
  correctColor
};
