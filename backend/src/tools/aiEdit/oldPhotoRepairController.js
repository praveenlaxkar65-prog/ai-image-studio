const fetch = global.fetch;
const nodeFetch = require('node-fetch');

async function imageUrlToBase64(url) {
  const res = await nodeFetch(url);
  if (!res.ok) throw new Error('Failed to fetch image: ' + url);
  const buf = await res.buffer();
  return buf.toString('base64');
}
const { randomUUID } = require('crypto');
const { supabase } = require('../../db/dbConnect');
const { checkBalance, deductCredits } = require('../../credits/creditService');
const { getActiveStorageAdapter, getStorageConfig } = require('../../storage/storageAdapterRegistry');

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8001';

async function repairOldPhoto(req, res) {
  try {
    const userId = req.user.id;
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, message: 'imageUrl is required.' });

    const { data: tool, error: toolError } = await supabase.from('tools_config').select('credit_cost').eq('tool_key', 'old_photo_repair').eq('is_active', true).maybeSingle();
    if (toolError) throw toolError;
    if (!tool) return res.status(404).json({ success: false, message: 'Old photo repair tool is not configured.' });

    const creditCost = Number(tool.credit_cost || 0);
    const balance = await checkBalance(userId, creditCost);
    if (!balance.sufficient) return res.status(402).json({ success: false, message: 'Insufficient credits.', available: balance.currentBalance, required: creditCost });

    let pythonResult;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      const pythonResponse = await fetch(`${PYTHON_AI_SERVICE_URL}/process/old-photo-repair`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: await imageUrlToBase64(imageUrl) }), signal: controller.signal
      });
      clearTimeout(timeoutId);
      pythonResult = await pythonResponse.json();
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') return res.status(504).json({ success: false, message: 'Old photo repair service timed out.' });
      return res.status(502).json({ success: false, message: 'Old photo repair service unavailable.' });
    }

    if (!pythonResult || !pythonResult.success) return res.status(500).json({ success: false, message: pythonResult?.message || 'Old photo repair failed.' });

    const outputBuffer = Buffer.from(pythonResult.imageBase64, 'base64');
    const adapter = await getActiveStorageAdapter();
    const storageConfig = await getStorageConfig();
    const fileName = `old_photo_repair_${randomUUID()}.png`;
    const uploadResult = await adapter.uploadFile(outputBuffer, fileName, storageConfig);
    const resultUrl = uploadResult?.url || uploadResult?.publicUrl || uploadResult;
    if (!resultUrl) throw new Error('Storage adapter did not return file URL.');

    const idempotencyKey = `${userId}_old_photo_repair_${randomUUID()}`;
    const deduction = await deductCredits(userId, creditCost, 'old_photo_repair', idempotencyKey);
    return res.json({ success: true, resultUrl, creditsDeducted: creditCost, newBalance: deduction.newBalance });
  } catch (error) {
    console.error('repairOldPhoto:', error);
    return res.status(500).json({ success: false, message: error.message || 'Old photo repair failed.' });
  }
}

module.exports = { repairOldPhoto };
