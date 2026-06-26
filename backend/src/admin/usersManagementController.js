const { supabase } = require('../db/dbConnect');
const { addCredits } = require('../credits/creditService');

/**
 * Get all users (paginated, with optional search)
 * query: { page, limit, search }
 */
async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, name, email, role, credits_balance, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return res.status(200).json({ success: true, users: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Get single user detail + recent transaction history
 */
async function getUserDetail(req, res) {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, credits_balance, status, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return res.status(200).json({ success: true, user, recentTransactions: transactions || [] });
  } catch (err) {
    console.error('getUserDetail error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Admin manually adds credits to a user
 * body: { amount, reason }
 */
async function manuallyAddCredits(req, res) {
  try {
    const { userId } = req.params;
    const { amount, reason = 'Admin manual credit addition' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount is required' });
    }

    const result = await addCredits(userId, amount, reason);

    return res.status(200).json({ success: true, newBalance: result.newBalance });
  } catch (err) {
    console.error('manuallyAddCredits error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Ban or unban a user
 * body: { status ('active' | 'banned') }
 */
async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be 'active' or 'banned'" });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, name, email, status')
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'User not found or update failed' });
    }

    return res.status(200).json({ success: true, user: data });
  } catch (err) {
    console.error('updateUserStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

module.exports = {
  getAllUsers,
  getUserDetail,
  manuallyAddCredits,
  updateUserStatus,
};
