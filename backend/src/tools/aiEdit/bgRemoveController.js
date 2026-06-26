// backend/src/tools/aiEdit/bgRemoveController.js

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

const VALID_REPLACEMENTS = [
  'transparent',
  'color',
  'blur'
];

async function removeBackground(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      replacementType = 'transparent',
      replacementColor
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required.'
      });
    }

    if (!VALID_REPLACEMENTS.includes(replacementType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid replacementType.'
      });
    }

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'bg_remove')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Background removal tool is not configured.'
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
        'bg_remove',
        {
          imageUrl,
          replacementType,
          replacementColor
        },
        {}
      );
    } catch (providerError) {
      console.error(
        'Background removal provider failed:',
        providerError
      );

      return res.status(500).json({
        success: false,
        message:
          providerError.message ||
          'Background removal failed.'
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
        `bg_remove_${randomUUID()}.png`;

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
      `${userId}_bg_remove_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'bg_remove',
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
      'removeBackground:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Background removal failed.'
    });
  }
}

module.exports = {
  removeBackground
};
