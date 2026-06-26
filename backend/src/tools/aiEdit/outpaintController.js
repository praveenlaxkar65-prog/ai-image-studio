// backend/src/tools/aiEdit/outpaintController.js

const { randomUUID } = require('crypto');

const { supabase } = require('../../db/dbConnect');
const { routeToProvider } = require('../../providers/providerRouter');

const {
  checkBalance,
  deductCredits
} = require('../../credits/creditService');

const {
  getActiveStorageAdapter,
  getStorageConfig
} = require('../../storage/storageAdapterRegistry');

const VALID_DIRECTIONS = [
  'left',
  'right',
  'top',
  'bottom',
  'all'
];

function clampExpandPixels(value) {
  const pixels = Number(value);

  if (Number.isNaN(pixels)) {
    return 200;
  }

  return Math.max(1, pixels);
}

async function outpaintImage(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      direction = 'all',
      expandPixels = 200,
      prompt
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required.'
      });
    }

    if (!VALID_DIRECTIONS.includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid direction.'
      });
    }

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'outpaint_image')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Outpaint tool is not configured.'
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

    let providerResult;

    try {
      providerResult = await routeToProvider(
        'outpaint_image',
        {
          imageUrl,
          direction,
          expandPixels: clampExpandPixels(expandPixels),
          prompt
        },
        {}
      );
    } catch (providerError) {
      console.error(
        'Outpaint provider failed:',
        providerError
      );

      return res.status(500).json({
        success: false,
        message:
          providerError.message ||
          'Image outpainting failed.'
      });
    }

    let resultUrl = null;

    if (providerResult?.resultUrl) {
      resultUrl = providerResult.resultUrl;
    } else if (providerResult?.resultBuffer) {
      const adapter =
        await getActiveStorageAdapter();

      const storageConfig =
        await getStorageConfig();

      const fileName =
        `outpaint_${randomUUID()}.png`;

      resultUrl =
        await adapter.uploadFile(
          providerResult.resultBuffer,
          fileName,
          storageConfig
        );
    } else {
      return res.status(500).json({
        success: false,
        message:
          'Provider returned no usable result.'
      });
    }

    const idempotencyKey =
      `${userId}_outpaint_image_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'outpaint_image',
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
      'outpaintImage:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Image outpainting failed.'
    });
  }
}

module.exports = {
  outpaintImage
};
