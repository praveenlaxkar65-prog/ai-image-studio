const { supabase } = require('../db/dbConnect');

async function getBalance(req, res) {
  try {
    const { data } = await supabase
      .from('users')
      .select('credits_balance')
      .eq('id', req.user.id)
      .single();

    res.json({
      success: true,
      balance: data.credits_balance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

async function getTransactionHistory(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    res.json({
      success: true,
      page,
      limit,
      total: count,
      transactions: data || []
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

module.exports = {
  getBalance,
  getTransactionHistory
};
