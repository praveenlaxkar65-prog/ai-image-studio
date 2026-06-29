const sharp = require('sharp');
const fetch = require('node-fetch');
const { randomUUID } = require('crypto');
const { supabase } = require('../../db/dbConnect');
const { checkBalance, deductCredits } = require('../../credits/creditService');
const { getActiveStorageAdapter, getStorageConfig } = require('../../storage/storageAdapterRegistry');

async function convertFile(req, res) {
  try {
    const userId = req.user.id;
    const { imageUrl, targetFormat, quality = 90 } = req.body;
    const allowedFormats = ['png', 'jpeg', 'webp', 'avif'];

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }
    if (!targetFormat || !allowedFormats.includes(targetFormat.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `targetFormat must be one of: ${allowedFormats.join(', ')}`,
      });
    }

    const { data: tool, error: toolError } = await supabase
      .from('tools_config')
      .select('credit_cost')
      .eq('tool_key', 'file_conversion')
      .eq('is_active', true)
      .maybeSingle();

    if (toolError) throw toolError;
    if (!tool) {
      return res.status(404).json({ success: false, message: 'File conversion tool is not configured.' });
    }

    const creditCost = Number(tool.credit_cost || 0);
    const balance = await checkBalance(userId, creditCost);
    if (!balance.sufficient) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient credits.',
        available: balance.currentBalance,
        required: creditCost,
      });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'Failed to fetch source image.' });
    }

    const inputBuffer = Buffer.from(await response.arrayBuffer());
    const format = targetFormat.toLowerCase();
    const clampedQuality = Math.min(100, Math.max(1, quality));

    let pipeline = sharp(inputBuffer);
    switch (format) {
      case 'png':  pipeline = pipeline.png({ quality: clampedQuality }); break;
      case 'jpeg': pipeline = pipeline.jpeg({ quality: clampedQuality }); break;
      case 'webp': pipeline = pipeline.webp({ quality: clampedQuality }); break;
      case 'avif': pipeline = pipeline.avif({ quality: clampedQuality }); break;
    }

    const outputBuffer = await pipeline.toBuffer();

    const adapter = await getActiveStorageAdapter();
    const storageConfig = await getStorageConfig();
    const fileName = `converted_${randomUUID()}.${format}`;
    const resultUrl = await adapter.uploadFile(outputBuffer, fileName, storageConfig);

    const idempotencyKey = `${userId}_file_conversion_${Date.now()}`;
    const deduction = await deductCredits(userId, creditCost, 'file_conversion', idempotencyKey);

    return res.json({
      success: true,
      resultUrl,
      creditsDeducted: creditCost,
      newBalance: deduction.newBalance,
      convertedFormat: format,
    });

  } catch (err) {
    console.error('convertFile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'File conversion failed.' });
  }
}

module.exports = { convertFile };
