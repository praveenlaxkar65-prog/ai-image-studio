const { supabase } = require('../../db/dbConnect');
const { checkBalance, deductCredits } = require('../../credits/creditService');
const { getActiveStorageAdapter } = require('../../storage/storageAdapterRegistry');
const { routeToProvider } = require('../../providers/providerRouter');

/**
 * Apply an artistic style to an existing image
 * body: { imageUrl, styleName, styleReferenceUrl (optional), intensity }
 */
async function applyStyleTransfer(req, res) {
  try {
    const userId = req.user.id;
    const { imageUrl, styleName, styleReferenceUrl = null, intensity = 7 } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }
    if (!styleName && !styleReferenceUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either styleName or styleReferenceUrl must be provided',
      });
    }

    const { data: toolConfig, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'style_transfer')
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

    const clampedIntensity = Math.min(10, Math.max(1, intensity));

    let providerResult;
    try {
      providerResult = await routeToProvider(
        'style_transfer',
        { imageUrl, styleName, styleReferenceUrl, intensity: clampedIntensity },
        {}
      );
    } catch (providerErr) {
      console.error('Style transfer provider error:', providerErr);
      return res.status(500).json({
        success: false,
        message: 'Style transfer failed at provider level',
        error: providerErr.message,
      });
    }

    let resultUrl;
    if (providerResult.resultUrl) {
      resultUrl = providerResult.resultUrl;
    } else if (providerResult.resultBuffer) {
      const storageAdapter = getActiveStorageAdapter();
      const fileName = `style_transfer_${userId}_${Date.now()}.png`;
      resultUrl = await storageAdapter.uploadFile(providerResult.resultBuffer, fileName, {});
    } else {
      return res.status(500).json({ success: false, message: 'Provider returned no usable result' });
    }

    const idempotencyKey = `${userId}_style_transfer_${Date.now()}`;
    const deductResult = await deductCredits(userId, requiredCredits, 'style_transfer', idempotencyKey);

    return res.status(200).json({
      success: true,
      resultUrl,
      creditsDeducted: requiredCredits,
      newBalance: deductResult.newBalance,
    });
  } catch (err) {
    console.error('applyStyleTransfer error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = { applyStyleTransfer };
