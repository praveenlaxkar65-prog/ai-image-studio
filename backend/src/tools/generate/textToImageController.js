const { supabase } = require('../../db/dbConnect');
const { checkBalance, deductCredits } = require('../../credits/creditService');
const { getActiveStorageAdapter } = require('../../storage/storageAdapterRegistry');
const { routeToProvider } = require('../../providers/providerRouter');

/**
 * Generate a new image purely from a text prompt (Text-to-Image)
 * body: { prompt, negativePrompt, width, height, style }
 */
async function generateImage(req, res) {
  try {
    const userId = req.user.id;
    const { prompt, negativePrompt = '', width = 512, height = 512, style = null } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    // Fetch credit cost from DB (zero-hardcode)
    const { data: toolConfig, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'text_to_image')
      .single();

    if (toolError || !toolConfig) {
      return res.status(500).json({ success: false, message: 'Tool configuration not found' });
    }

    const requiredCredits = toolConfig.credit_cost;

    const balanceCheck = await checkBalance(userId, requiredCredits);
    if (!balanceCheck.sufficient) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient credits',
        required: requiredCredits,
        available: balanceCheck.currentBalance,
      });
    }

    // Route to provider (provider-adapter pattern, zero-hardcode)
    let providerResult;
    try {
      providerResult = await routeToProvider(
        'text_to_image',
        { prompt, negativePrompt, width, height, style },
        {}
      );
    } catch (providerErr) {
      console.error('Text-to-Image provider error:', providerErr);
      return res.status(500).json({
        success: false,
        message: 'Image generation failed at provider level',
        error: providerErr.message,
      });
    }

    let resultUrl;
    if (providerResult.resultUrl) {
      resultUrl = providerResult.resultUrl;
    } else if (providerResult.resultBuffer) {
      const storageAdapter = getActiveStorageAdapter();
      const fileName = `generated_${userId}_${Date.now()}.png`;
      resultUrl = await storageAdapter.uploadFile(providerResult.resultBuffer, fileName, {});
    } else {
      return res.status(500).json({ success: false, message: 'Provider returned no usable result' });
    }

    const idempotencyKey = `${userId}_text_to_image_${Date.now()}`;
    const deductResult = await deductCredits(userId, requiredCredits, 'text_to_image', idempotencyKey);

    return res.status(200).json({
      success: true,
      resultUrl,
      creditsDeducted: requiredCredits,
      newBalance: deductResult.newBalance,
    });
  } catch (err) {
    console.error('generateImage error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = { generateImage };
