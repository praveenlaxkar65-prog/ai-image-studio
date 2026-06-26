const providerRouter = require('../providers/providerRouter');

async function checkCopyright(imageUrl) {
  try {
    const result = await providerRouter.routeToProvider(
      'copyright_check',
      { imageUrl },
      {}
    );

    return {
      isFlagged: Boolean(result?.isFlagged),
      matchDetails: result?.matchDetails || null
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  checkCopyright
};
