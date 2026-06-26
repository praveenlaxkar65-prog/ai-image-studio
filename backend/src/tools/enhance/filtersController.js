// backend/src/tools/enhance/filtersController.js
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

const VALID_FILTERS = [
  'grayscale',
  'sepia',
  'vintage',
  'vivid'
];

async function applyFilter(req, res) {
  try {
    const userId = req.user.id;

    const {
      imageUrl,
      filterType
    } = req.body;

    if (!imageUrl || !filterType) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl and filterType are required.'
      });
    }

    if (!VALID_FILTERS.includes(filterType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filterType.'
      });
    }

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'apply_filter')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) {
      throw toolError;
    }

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Filter tool is not configured.'
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

    switch (filterType) {

      case 'grayscale':
        pipeline = pipeline.grayscale();
        break;

      case 'sepia':
        pipeline = pipeline
          .modulate({
            saturation: 0.3
          })
          .tint({
            r: 112,
            g: 66,
            b: 20
          });
        break;

      case 'vintage':
        pipeline = pipeline
          .tint({
            r: 100,
            g: 80,
            b: 60
          })
          .modulate({
            saturation: 0.6,
            brightness: 0.9
          })
          .linear(0.9, 5);
        break;

      case 'vivid':
        pipeline = pipeline.modulate({
          saturation: 1.6,
          brightness: 1.05
        });
        break;
    }

    const outputBuffer = await pipeline
      .png()
      .toBuffer();

    const adapter =
      await getActiveStorageAdapter();

    const storageConfig =
      await getStorageConfig();

    const fileName =
      `filter_${filterType}_${randomUUID()}.png`;

    const resultUrl =
      await adapter.uploadFile(
        outputBuffer,
        fileName,
        storageConfig
      );

    const idempotencyKey =
      `${userId}_apply_filter_${Date.now()}`;

    const deduction =
      await deductCredits(
        userId,
        creditCost,
        'apply_filter',
        idempotencyKey
      );

    return res.json({
      success: true,
      resultUrl,
      creditsDeducted: creditCost,
      newBalance: deduction.newBalance,
      filterApplied: filterType
    });

  } catch (error) {
    console.error(
      'applyFilter:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Filter processing failed.'
    });
  }
}

module.exports = {
  applyFilter
};
