const { supabase } = require('../../db/dbConnect');
const { checkBalance, deductCredits } = require('../../credits/creditService');
const { getActiveStorageAdapter } = require('../../storage/storageAdapterRegistry');
const { routeToProvider } = require('../../providers/providerRouter');

/**
 * Generate a character image with controllable attributes
 * body: { prompt, pose, expression, gender, hairStyle, makeup, width, height }
 */
async function generateCharacter(req, res) {
  try {
    const userId = req.user.id;
    const {
      prompt,
      pose = 'standing',
      expression = 'neutral',
      gender = 'any',
      hairStyle = 'default',
      makeup = 'none',
      width = 512,
      height = 768,
    } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const { data: toolConfig, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'character_generation')
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

    let providerResult;
    try {
      providerResult = await routeToProvider(
        'character_generation',
        { prompt, pose, expression, gender, hairStyle, makeup, width, height },
        {}
      );
    } catch (providerErr) {
      console.error('Character generation provider error:', providerErr);
      return res.status(500).json({
        success: false,
        message: 'Character generation failed at provider level',
        error: providerErr.message,
      });
    }

    let resultUrl;
    if (providerResult.resultUrl) {
      resultUrl = providerResult.resultUrl;
    } else if (providerResult.resultBuffer) {
      const storageAdapter = getActiveStorageAdapter();
      const fileName = `character_${userId}_${Date.now()}.png`;
      resultUrl = await storageAdapter.uploadFile(providerResult.resultBuffer, fileName, {});
    } else {
      return res.status(500).json({ success: false, message: 'Provider returned no usable result' });
    }

    const idempotencyKey = `${userId}_character_generation_${Date.now()}`;
    const deductResult = await deductCredits(userId, requiredCredits, 'character_generation', idempotencyKey);

    return res.status(200).json({
      success: true,
      resultUrl,
      creditsDeducted: requiredCredits,
      newBalance: deductResult.newBalance,
      attributesUsed: { pose, expression, gender, hairStyle, makeup },
    });
  } catch (err) {
    console.error('generateCharacter error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = { generateCharacter };
