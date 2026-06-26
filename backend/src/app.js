require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { testConnection } = require('./db/dbConnect');
const { generalLimiter } = require('./auth/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Core Middleware =====
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// ===== Health Check Route =====
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'AI Image Studio Backend',
    timestamp: new Date().toISOString(),
  });
});

// ===== Route Mounting =====
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tools', require('./routes/toolRoutes'));
app.use('/api/prompt-studio', require('./routes/promptStudioRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ===== Start Server =====
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});

module.exports = app;
