const { getJobStatus } = require('./queueManager');

async function getJobStatusHandler(req, res) {
  try {
    const { jobId } = req.params;

    const job = await getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      job
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

module.exports = {
  getJobStatusHandler
};
