const providerRouter = require('../providers/providerRouter');

async function checkNSFW(imageUrl) {
  try {
    const result = await providerRouter.routeToProvider(
      'nsfw_check',
      { imageUrl },
      {}
    );

    return {
      isSafe: Boolean(result?.isSafe),
      confidence: Number(result?.confidence || 0)
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  checkNSFW
};
