const { supabase } = require('../db/dbConnect');
const { routeToProvider } = require('../providers/providerRouter');

async function getActiveTools() {
  const { data } = await supabase
    .from('tools_config')
    .select('tool_key, tool_name')
    .eq('is_active', true);

  return data || [];
}

async function parseCommand(
  userPrompt,
  uploadedImages = []
) {
  try {
    const toolsList = await getActiveTools();

    const response =
      await routeToProvider(
        'prompt_planner',
        {
          userPrompt,
          availableTools: toolsList,
          imageCount: uploadedImages.length
        },
        {}
      );

    return {
      steps: response?.steps || [],
      clarificationNeeded:
        Boolean(response?.clarificationNeeded),
      clarificationQuestion:
        response?.clarificationQuestion || null
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  parseCommand
};
