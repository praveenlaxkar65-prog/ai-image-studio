const { supabase } = require('../db/dbConnect');

async function getUser(userId) {
  const { data } = await supabase
    .from('users')
    .select('credits_balance')
    .eq('id', userId)
    .single();

  return data;
}

async function checkBalance(userId, requiredCredits) {
  try {
    const user = await getUser(userId);

    return {
      sufficient: user.credits_balance >= requiredCredits,
      currentBalance: user.credits_balance
    };
  } catch (err) {
    throw err;
  }
}

async function deductCredits(userId, amount, toolKey, idempotencyKey) {
  try {
    const { data: existing } = await supabase
      .from('transactions')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      return { success: true, duplicate: true };
    }

    const user = await getUser(userId);

    if (user.credits_balance < amount) {
      return { success: false, message: 'Insufficient credits' };
    }

    const newBalance = user.credits_balance - amount;

    await supabase
      .from('users')
      .update({ credits_balance: newBalance })
      .eq('id', userId);

    await supabase.from('transactions').insert({
      user_id: userId,
      tool_key: toolKey,
      credits_amount: -Math.abs(amount),
      idempotency_key: idempotencyKey,
      reason: 'credit_deduction',
      status: 'success'
    });

    return { success: true, newBalance };
  } catch (err) {
    throw err;
  }
}

async function refundCredits(userId, amount, toolKey, reason) {
  try {
    const user = await getUser(userId);

    const newBalance = user.credits_balance + amount;

    await supabase
      .from('users')
      .update({ credits_balance: newBalance })
      .eq('id', userId);

    await supabase.from('transactions').insert({
      user_id: userId,
      tool_key: toolKey,
      credits_amount: Math.abs(amount),
      reason,
      status: 'refunded'
    });

    return { success: true, newBalance };
  } catch (err) {
    throw err;
  }
}

async function addCredits(userId, amount, reason) {
  try {
    const user = await getUser(userId);

    const newBalance = user.credits_balance + amount;

    await supabase
      .from('users')
      .update({ credits_balance: newBalance })
      .eq('id', userId);

    await supabase.from('transactions').insert({
      user_id: userId,
      tool_key: 'credit_addition',
      credits_amount: Math.abs(amount),
      reason,
      status: 'success'
    });

    return { success: true, newBalance };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  checkBalance,
  deductCredits,
  refundCredits,
  addCredits
};
