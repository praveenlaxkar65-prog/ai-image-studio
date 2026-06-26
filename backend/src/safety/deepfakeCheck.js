const providerRouter = require('../providers/providerRouter');

async function checkDeepfake(imageUrl) {
  try {
    const result = await providerRouter.routeToProvider(
      'deepfake_check',
      { imageUrl },
      {}
    );

    return {
      isDeepfake: Boolean(result?.isDeepfake),
      confidence: Number(result?.confidence || 0)
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  checkDeepfake
};
