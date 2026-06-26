const { supabase } = require('../db/dbConnect');
const { getCachedSetting } = require('../config/configCache');

/**
 * Get current credit balance for logged-in user
 */
async function getWalletBalance(req, res) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('users')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, creditsBalance: data.credits_balance });
  } catch (err) {
    console.error('getWalletBalance error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Get available credit packages (admin-configured, for "Buy Credits" screen)
 */
async function getCreditPackages(req, res) {
  try {
    const packages = await getCachedSetting('credit_packages');

    return res.status(200).json({ success: true, packages: packages || [] });
  } catch (err) {
    console.error('getCreditPackages error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Get available subscription plans (admin-configured)
 */
async function getSubscriptionPlans(req, res) {
  try {
    const plans = await getCachedSetting('subscription_plans');

    return res.status(200).json({ success: true, plans: plans || [] });
  } catch (err) {
    console.error('getSubscriptionPlans error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Get transaction/usage history for logged-in user (paginated)
 * query: { page, limit }
 */
async function getTransactionHistory(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      transactions: data,
      total: count,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('getTransactionHistory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * NOTE: Actual credit-purchase (payment-gateway integration) is NOT included here.
 * This is a placeholder that records intent - real payment-provider webhook/confirmation
 * should call creditService.addCredits() after successful payment verification.
 * body: { packageId }
 */
async function initiatePurchase(req, res) {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ success: false, message: 'packageId is required' });
    }

    const packages = await getCachedSetting('credit_packages');
    const selectedPackage = (packages || []).find((p) => p.id === packageId);

    if (!selectedPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Placeholder response - real implementation will integrate a payment gateway
    // (e.g. Razorpay/Stripe) here, configured via Admin Panel, zero-hardcoded.
    return res.status(200).json({
      success: true,
      message: 'Purchase flow not yet connected to a payment gateway',
      package: selectedPackage,
    });
  } catch (err) {
    console.error('initiatePurchase error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = {
  getWalletBalance,
  getCreditPackages,
  getSubscriptionPlans,
  getTransactionHistory,
  initiatePurchase,
};
