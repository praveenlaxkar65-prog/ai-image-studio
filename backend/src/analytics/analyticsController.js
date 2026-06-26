const { supabase } = require('../db/dbConnect');

async function getUsageStats(req, res) {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('analytics_logs')
      .select('event_data,event_type,created_at')
      .eq('event_type', 'tool_usage');

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;

    if (error) throw error;

    const stats = {};

    for (const row of data || []) {
      const toolKey = row.event_data?.toolKey;

      if (!toolKey) continue;

      stats[toolKey] = (stats[toolKey] || 0) + 1;
    }

    return res.json({
      success: true,
      stats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

async function getRevenueStats(req, res) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('credits_amount');

    if (error) throw error;

    let purchasedCredits = 0;
    let usedCredits = 0;

    for (const tx of data || []) {
      const amount = Number(tx.credits_amount || 0);

      if (amount > 0) {
        purchasedCredits += amount;
      } else {
        usedCredits += Math.abs(amount);
      }
    }

    return res.json({
      success: true,
      purchasedCredits,
      usedCredits,
      netCredits: purchasedCredits - usedCredits
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

module.exports = {
  getUsageStats,
  getRevenueStats
};
