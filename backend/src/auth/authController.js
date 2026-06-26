const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../db/dbConnect');
const { getCachedSetting } = require('../config/configCache');

async function createToken(user) {
  const expiresIn =
    process.env.JWT_EXPIRES_IN ||
    (await getCachedSetting('jwt_expiry')) ||
    '7d'; // default fallback, admin override DB se

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_ROUNDS || 10)
    );

    const welcomeCredits =
      Number(await getCachedSetting('welcome_credits')) || 50; // default fallback

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role: 'user',
        credits_balance: welcomeCredits
      })
      .select('id,name,email,role,status,credits_balance,created_at')
      .single();

    if (error) throw error;

    const token = await createToken(user);

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Account banned' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = await createToken(user);

    delete user.password_hash;

    res.json({
      success: true,
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getMe(req, res) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id,name,email,role,status,credits_balance,created_at,updated_at')
      .eq('id', req.user.id)
      .maybeSingle();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  signup,
  login,
  getMe
};
