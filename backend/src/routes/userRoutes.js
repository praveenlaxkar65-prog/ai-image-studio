const express = require('express');
const router = express.Router();

const { verifyToken } = require('../auth/authMiddleware');

const { getProfile, updateProfile, changePassword, deleteAccount } = require('../users/userController');
const { getGallery, getProjectDetail, saveToGallery, deleteProject } = require('../users/galleryController');
const {
  getWalletBalance,
  getCreditPackages,
  getSubscriptionPlans,
  getTransactionHistory,
  initiatePurchase,
} = require('../users/walletController');
const { getBalance, getTransactionHistory: getCreditHistory } = require('../credits/creditController');
const { getNotifications, markAsRead } = require('../notifications/notificationController');

// Profile
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/profile/password', verifyToken, changePassword);
router.delete('/profile', verifyToken, deleteAccount);

// Gallery
router.get('/gallery', verifyToken, getGallery);
router.get('/gallery/:projectId', verifyToken, getProjectDetail);
router.put('/gallery/:projectId/save', verifyToken, saveToGallery);
router.delete('/gallery/:projectId', verifyToken, deleteProject);

// Wallet
router.get('/wallet/balance', verifyToken, getWalletBalance);
router.get('/wallet/packages', verifyToken, getCreditPackages);
router.get('/wallet/plans', verifyToken, getSubscriptionPlans);
router.get('/wallet/transactions', verifyToken, getTransactionHistory);
router.post('/wallet/purchase', verifyToken, initiatePurchase);

// Credits (quick balance/history alt-routes used by credit engine directly)
router.get('/credits/balance', verifyToken, getBalance);
router.get('/credits/history', verifyToken, getCreditHistory);

// Notifications
router.get('/notifications', verifyToken, getNotifications);
router.put('/notifications/:notificationId/read', verifyToken, markAsRead);

module.exports = router;
