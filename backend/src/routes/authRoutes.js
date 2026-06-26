const express = require('express');
const router = express.Router();

const { signup, login, getMe } = require('../auth/authController');
const { verifyToken } = require('../auth/authMiddleware');
const { authLimiter } = require('../auth/rateLimiter');

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/me', verifyToken, getMe);

module.exports = router;
