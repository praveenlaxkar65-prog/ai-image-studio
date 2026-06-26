const { supabase } = require('../../db/dbConnect');
const { checkBalance, deductCredits } = require('../../credits/creditService');
const { getActiveStorageAdapter } = require('../../storage/storageAdapterRegistry');
const { routeToProvider } = require('../../providers/providerRouter');

/**
 * Modify attributes of an EXISTING character image
 * (pose/expression/gender/hair/makeup change on an already-uploaded/generated image)
 * body: { imageUrl, pose, expression, gender, hairStyle, makeup }
 */
async function controlCharacter(req, res) {
  try {
    const userId = req.user.id;
    const { imageUrl, pose, expression, gender, hairStyle, makeup } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }

    // At least one attribute must be provided to change
    if (!pose && !expression && !gender && !hairStyle && !makeup) {
      return res.status(400).json({
        success: false,
        message: 'At least one attribute (pose, expression, gender, hairStyle, makeup) must be provided',
      });
    }

    const { data: toolConfig, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'character_control')
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
        'character_control',
        { imageUrl, pose, expression, gender, hairStyle, makeup },
        {}
      );
    } catch (providerErr) {
      console.error('Character control provider error:', providerErr);
      return res.status(500).json({
        success: false,
        message: 'Character control failed at provider level',
        error: providerErr.message,
      });
    }

    let resultUrl;
    if (providerResult.resultUrl) {
      resultUrl = providerResult.resultUrl;
    } else if (providerResult.resultBuffer) {
      const storageAdapter = getActiveStorageAdapter();
      const fileName = `char_control_${userId}_${Date.now()}.png`;
      resultUrl = await storageAdapter.uploadFile(providerResult.resultBuffer, fileName, {});
    } else {
      return res.status(500).json({ success: false, message: 'Provider returned no usable result' });
    }

    const idempotencyKey = `${userId}_character_control_${Date.now()}`;
    const deductResult = await deductCredits(userId, requiredCredits, 'character_control', idempotencyKey);

    return res.status(200).json({
      success: true,
      resultUrl,
      creditsDeducted: requiredCredits,
      newBalance: deductResult.newBalance,
    });
  } catch (err) {
    console.error('controlCharacter error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = { controlCharacter };
