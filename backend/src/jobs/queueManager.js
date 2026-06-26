const { Queue } = require('bullmq');
const { supabase } = require('../db/dbConnect');

const QUEUE_NAME = 'image-processing-queue';

const queue = new Queue(QUEUE_NAME, {
  connection: {
    url: process.env.REDIS_URL
  }
});

async function addJob(jobData) {
  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: jobData.userId,
        project_id: jobData.projectId || null,
        job_type: jobData.jobType,
        steps: jobData.steps.map(step => ({
          ...step,
          status: 'queued'
        })),
        overall_status: 'queued'
      })
      .select()
      .single();

    if (error) throw error;

    await queue.add(
      'process-job',
      {
        ...jobData,
        dbJobId: job.id
      },
      {
        jobId: job.id
      }
    );

    return { jobId: job.id };
  } catch (err) {
    throw err;
  }
}

async function getJobStatus(jobId) {
  try {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    return data;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  QUEUE_NAME,
  queue,
  addJob,
  getJobStatus
};
