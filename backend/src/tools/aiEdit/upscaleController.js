// backend/src/tools/aiEdit/upscaleController.js

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

const VALID_SCALE_FACTORS = [2, 4];

async function upscaleImage(req, res) {
  try {
    const userId = req.user.id;

    let {
      imageUrl,
      scaleFactor = 2,
      targetResolution
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required.'
      });
    }

    scaleFactor = Number(scaleFactor);

    if (!VALID_SCALE_FACTORS.includes(scaleFactor)) {
      return res.status(400).json({
        success: false,
        message: 'scaleFactor must be 2 or 4.'
      });
    }

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'upscale_image')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Upscale tool is not configured.'
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
        'upscale_image',
        {
          imageUrl,
          scaleFactor,
          targetResolution
        },
        {}
      );
    } catch (providerError) {
      console.error(
        'Upscale provider failed:',
        providerError
      );

      return res.status(500).json({
        success: false,
        message:
          providerError.message ||
          'Image upscaling failed.'
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
        `upscale_${randomUUID()}.png`;

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
      `${userId}_upscale_image_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'upscale_image',
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
      'upscaleImage:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Image upscaling failed.'
    });
  }
}

module.exports = {
  upscaleImage
};
