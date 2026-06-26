// backend/src/tools/aiEdit/faceRestoreController.js

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

function clampStrength(value) {
  const strength = Number(value);

  if (Number.isNaN(strength)) {
    return 7;
  }

  return Math.max(1, Math.min(10, strength));
}

async function restoreFace(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      enhancementStrength = 7
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required.'
      });
    }

    const strength = clampStrength(
      enhancementStrength
    );

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'face_restore')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Face restore tool is not configured.'
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
        'face_restore',
        {
          imageUrl,
          enhancementStrength: strength
        },
        {}
      );
    } catch (providerError) {
      console.error(
        'Face restore provider failed:',
        providerError
      );

      return res.status(500).json({
        success: false,
        message:
          providerError.message ||
          'Face restoration failed.'
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
        `face_restore_${randomUUID()}.png`;

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
      `${userId}_face_restore_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'face_restore',
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
      'restoreFace:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Face restoration failed.'
    });
  }
}

module.exports = {
  restoreFace
};
