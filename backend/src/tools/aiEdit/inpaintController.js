// backend/src/tools/aiEdit/inpaintController.js

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

const VALID_MODES = [
  'remove',
  'add'
];

async function inpaintImage(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      maskUrl,
      prompt,
      mode = 'remove'
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required.'
      });
    }

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        success: false,
        message: 'prompt is required.'
      });
    }

    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mode.'
      });
    }

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'inpaint_image')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Inpaint tool is not configured.'
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
        'inpaint_image',
        {
          imageUrl,
          maskUrl,
          prompt,
          mode
        },
        {}
      );
    } catch (providerError) {
      console.error(
        'Inpaint provider failed:',
        providerError
      );

      return res.status(500).json({
        success: false,
        message:
          providerError.message ||
          'Image inpainting failed.'
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
        `inpaint_${randomUUID()}.png`;

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
      `${userId}_inpaint_image_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'inpaint_image',
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
      'inpaintImage:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Image inpainting failed.'
    });
  }
}

module.exports = {
  inpaintImage
};
