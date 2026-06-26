const express = require('express');
const router = express.Router();

const { verifyToken } = require('../auth/authMiddleware');
const { requireRole } = require('../auth/roleGuard');

const adminOnly = [verifyToken, requireRole('admin')];

const {
  getAllTools,
  getToolByKey,
  createTool,
  updateTool,
  deleteTool,
} = require('../admin/toolsConfigController');

const {
  getAllProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  testProviderConnection,
} = require('../admin/providersConfigController');

const {
  getPricingSettings,
  updateWelcomeCredits,
  updateCreditPackages,
  updateSubscriptionPlans,
} = require('../admin/pricingConfigController');

const {
  getStorageSettings,
  updateStorageProvider,
  updateStorageConfig,
  updateAutoDeleteTimer,
} = require('../admin/storageConfigController');

const {
  getModerationQueue,
  getFlagDetail,
  resolveFlag,
  updateModerationSettings,
} = require('../admin/moderationController');

const {
  getAllUsers,
  getUserDetail,
  manuallyAddCredits,
  updateUserStatus,
} = require('../admin/usersManagementController');

const {
  getAllSettings,
  updateSetting,
  updateGeneralSettings,
} = require('../admin/systemSettingsController');

const { getUsageStats, getRevenueStats } = require('../analytics/analyticsController');

// Tools Config
router.get('/tools', adminOnly, getAllTools);
router.get('/tools/:toolKey', adminOnly, getToolByKey);
router.post('/tools', adminOnly, createTool);
router.put('/tools/:toolKey', adminOnly, updateTool);
router.delete('/tools/:toolKey', adminOnly, deleteTool);

// Providers Config
router.get('/providers', adminOnly, getAllProviders);
router.post('/providers', adminOnly, createProvider);
router.put('/providers/:providerId', adminOnly, updateProvider);
router.delete('/providers/:providerId', adminOnly, deleteProvider);
router.post('/providers/:providerId/test', adminOnly, testProviderConnection);

// Pricing Config
router.get('/pricing', adminOnly, getPricingSettings);
router.put('/pricing/welcome-credits', adminOnly, updateWelcomeCredits);
router.put('/pricing/packages', adminOnly, updateCreditPackages);
router.put('/pricing/plans', adminOnly, updateSubscriptionPlans);

// Storage Config
router.get('/storage', adminOnly, getStorageSettings);
router.put('/storage/provider', adminOnly, updateStorageProvider);
router.put('/storage/config', adminOnly, updateStorageConfig);
router.put('/storage/auto-delete', adminOnly, updateAutoDeleteTimer);

// Moderation
router.get('/moderation', adminOnly, getModerationQueue);
router.get('/moderation/:flagId', adminOnly, getFlagDetail);
router.put('/moderation/:flagId/resolve', adminOnly, resolveFlag);
router.put('/moderation/settings', adminOnly, updateModerationSettings);

// Users Management
router.get('/users', adminOnly, getAllUsers);
router.get('/users/:userId', adminOnly, getUserDetail);
router.post('/users/:userId/add-credits', adminOnly, manuallyAddCredits);
router.put('/users/:userId/status', adminOnly, updateUserStatus);

// System Settings
router.get('/settings', adminOnly, getAllSettings);
router.put('/settings', adminOnly, updateSetting);
router.put('/settings/general', adminOnly, updateGeneralSettings);

// Analytics
router.get('/analytics/usage', adminOnly, getUsageStats);
router.get('/analytics/revenue', adminOnly, getRevenueStats);

module.exports = router;
