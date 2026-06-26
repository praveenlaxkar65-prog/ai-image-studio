const { supabase } = require('../db/dbConnect');
const bcrypt = require('bcrypt');

/**
 * Get current logged-in user's profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, credits_balance, status, created_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user: data });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Update profile fields (name only - email/credits changes go through dedicated flows)
 * body: { name }
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, name, email, role, credits_balance')
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Update failed' });
    }

    return res.status(200).json({ success: true, user: data });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Change password
 * body: { currentPassword, newPassword }
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'currentPassword and newPassword (min 6 chars) are required',
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

/**
 * Delete own account (soft - marks status, does not hard-delete data)
 */
async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('users')
      .update({ status: 'banned', updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Account deactivated' });
  } catch (err) {
    console.error('deleteAccount error:',
