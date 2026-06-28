require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { testConnection } = require('./db/dbConnect');
const { generalLimiter } = require('./auth/rateLimiter');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(generalLimiter);

app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'AI Image Studio Backend',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tools', require('./routes/toolRoutes'));
app.use('/api/prompt-studio', require('./routes/promptStudioRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});

module.exports = app;
