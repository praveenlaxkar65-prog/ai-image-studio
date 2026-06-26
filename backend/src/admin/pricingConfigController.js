const { supabase } = require('../db/dbConnect');
const { clearCache } = require('../config/configCache');

/**
 * Get current pricing-related settings (welcome credits, credit packages, subscription plans)
 */
async function getPricingSettings(req, res) {
  try {
    const keys = ['welcome_credits', 'credit_packages', 'subscription_plans'];

    const { data, error } = await supabase.from('system_settings').select('*').in('setting_key', keys);

    if (error) throw error;

    const settings = {};
    data.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return res.status(200).json({ success: true, settings });
  } catch (err) {
    console.error('getPricingSettings error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Update welcome credits given to new signups
 * body: { amount }
 */
async function updateWelcomeCredits(req, res) {
  try {
    const { amount } = req.body;

    if (amount === undefined || amount < 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert({ setting_key: 'welcome_credits', setting_value: amount, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });

    if (error) throw error;

    clearCache('welcome_credits');

    return res.status(200).json({ success: true, welcome_credits: amount });
  } catch (err) {
    console.error('updateWelcomeCredits error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Add or update a credit package (buy-credits options shown to users)
 * body: { packages: [{ id, credits, price, currency }] }
 */
async function updateCreditPackages(req, res) {
  try {
    const { packages } = req.body;

    if (!Array.isArray(packages)) {
      return res.status(400).json({ success: false, message: 'packages must be an array' });
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert({ setting_key: 'credit_packages', setting_value: packages, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });

    if (error) throw error;

    clearCache('credit_packages');

    return res.status(200).json({ success: true, credit_packages: packages });
  } catch (err) {
    console.error('updateCreditPackages error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Add or update subscription plans (future use)
 * body: { plans: [{ id, name, monthlyCredits, price, currency }] }
 */
async function updateSubscriptionPlans(req, res) {
  try {
    const { plans } = req.body;

    if (!Array.isArray(plans)) {
      return res.status(400).json({ success: false, message: 'plans must be an array' });
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert({ setting_key: 'subscription_plans', setting_value: plans, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });

    if (error) throw error;

    clearCache('subscription_plans');

    return res.status(200).json({ success: true, subscription_plans: plans });
  } catch (err) {
    console.error('updateSubscriptionPlans error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = {
  getPricingSettings,
  updateWelcomeCredits,
  updateCreditPackages,
  updateSubscriptionPlans,
};
