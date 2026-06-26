const commandParser = require('./commandParser');
const stepPlanner = require('./stepPlanner');

async function handlePromptSubmit(
  req,
  res
) {
  try {
    const {
      prompt,
      imageUrls = []
    } = req.body;

    const parsed =
      await commandParser.parseCommand(
        prompt,
        imageUrls
      );

    if (parsed.clarificationNeeded) {
      return res.json({
        success: true,
        clarificationNeeded: true,
        question:
          parsed.clarificationQuestion
      });
    }

    const plan =
      await stepPlanner.planSteps(
        parsed.steps,
        req.user.id
      );

    return res.json({
      success: true,
      clarificationNeeded: false,
      ...plan
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

async function handlePromptConfirm(
  req,
  res
) {
  try {
    const {
      executionPlan,
      projectId
    } = req.body;

    const result =
      await stepPlanner.executeSteps(
        executionPlan,
        req.user.id,
        projectId
      );

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

module.exports = {
  handlePromptSubmit,
  handlePromptConfirm
};
