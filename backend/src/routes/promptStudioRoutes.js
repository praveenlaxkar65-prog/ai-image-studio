const express = require('express');
const router = express.Router();

const { verifyToken } = require('../auth/authMiddleware');
const { handlePromptSubmit, handlePromptConfirm } = require('../agentic/promptStudioController');
const { getJobStatusHandler } = require('../jobs/jobStatusController');

router.post('/submit', verifyToken, handlePromptSubmit);
router.post('/confirm', verifyToken, handlePromptConfirm);
router.get('/job/:jobId', verifyToken, getJobStatusHandler);

module.exports = router;
