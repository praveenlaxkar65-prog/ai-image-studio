/**
 * Isko separate process/file se start karna hoga:
 * node src/jobs/jobWorker.js
 * ya app.js me bhi import karke run kar sakte hain
 */

const { Worker } = require('bullmq');
const { supabase } = require('../db/dbConnect');
const { getCachedSetting } = require('../config/configCache');
const { routeToProvider } = require('../providers/providerRouter');
const { notifyJobUpdate } = require('../notifications/notificationService');
const { QUEUE_NAME } = require('./queueManager');

async function updateJob(jobId, payload) {
  await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId);
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { dbJobId, userId, steps } = job.data;

    try {
      await updateJob(dbJobId, {
        overall_status: 'processing'
      });

      const updatedSteps = [];

      for (const step of steps) {
        try {
          const result = await routeToProvider(
            step.toolKey,
            step.inputData,
            {}
          );

          updatedSteps.push({
            ...step,
            status: 'completed',
            result
          });

          await updateJob(dbJobId, {
            steps: updatedSteps
          });

          await notifyJobUpdate(
            userId,
            dbJobId,
            'step_completed'
          );
        } catch (err) {
          updatedSteps.push({
            ...step,
            status: 'failed',
            error: err.message
          });

          await updateJob(dbJobId, {
            steps: updatedSteps,
            overall_status: 'failed'
          });

          await notifyJobUpdate(
            userId,
            dbJobId,
            'failed'
          );

          throw err;
        }
      }

      await updateJob(dbJobId, {
        steps: updatedSteps,
        overall_status: 'completed'
      });

      await notifyJobUpdate(
        userId,
        dbJobId,
        'completed'
      );
    } catch (err) {
      throw err;
    }
  },
  {
    connection: {
      url: process.env.REDIS_URL
    },
    concurrency:
      Number(
        await getCachedSetting('queue_concurrency')
      ) || 2
  }
);

worker.on('error', (err) => {
  console.error('Job Worker Error:', err);
});

module.exports = worker;
