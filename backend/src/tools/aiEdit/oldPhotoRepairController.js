// backend/src/tools/aiEdit/oldPhotoRepairController.js

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

async function repairOldPhoto(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      colorize = true,
      fixScratches = true
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
      .eq('tool_key', 'old_photo_repair')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Old photo repair tool is not configured.'
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
        'old_photo_repair',
        {
          imageUrl,
          colorize,
          fixScratches
        },
        {}
      );
    } catch (providerError) {
      console.error(
        'Old photo repair provider failed:',
        providerError
      );

      return res.status(500).json({
        success: false,
        message:
          providerError.message ||
          'Old photo repair failed.'
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
        `old_photo_repair_${randomUUID()}.png`;

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
      `${userId}_old_photo_repair_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'old_photo_repair',
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
      'repairOldPhoto:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Old photo repair failed.'
    });
  }
}

module.exports = {
  repairOldPhoto
};
