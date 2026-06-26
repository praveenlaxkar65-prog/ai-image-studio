const { supabase } = require('../db/dbConnect');
const { addJob } = require('../jobs/queueManager');
const { checkBalance } = require('../credits/creditService');

async function getToolCosts(toolKeys) {
  const { data } = await supabase
    .from('tools_config')
    .select('tool_key, credit_cost')
    .in('tool_key', toolKeys);

  return data || [];
}

async function planSteps(parsedSteps, userId) {
  try {
    const toolKeys = parsedSteps.map(
      s => s.toolKey
    );

    const toolConfigs =
      await getToolCosts(toolKeys);

    let totalCredits = 0;

    const steps = parsedSteps.map(step => {
      const tool = toolConfigs.find(
        t => t.tool_key === step.toolKey
      );

      const creditCost =
        Number(tool?.credit_cost || 0);

      totalCredits += creditCost;

      return {
        ...step,
        credit_cost: creditCost
      };
    });

    const balance = await checkBalance(
      userId,
      totalCredits
    );

    if (!balance.sufficient) {
      return {
        success: false,
        reason: 'insufficient_credits',
        required: totalCredits,
        available: balance.currentBalance
      };
    }

    return {
      success: true,
      executionPlan: {
        steps,
        totalCredits,
        estimatedTime:
          steps.length * 30
      }
    };
  } catch (err) {
    throw err;
  }
}

async function executeSteps(
  executionPlan,
  userId,
  projectId
) {
  try {
    const job = await addJob({
      userId,
      projectId,
      jobType: 'multi_step_prompt',
      steps: executionPlan.steps
    });

    return {
      jobId: job.jobId
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  planSteps,
  executeSteps
};
