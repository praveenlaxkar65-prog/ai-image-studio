const { supabase } = require('../db/dbConnect');
const {
  getActiveStorageAdapter,
  getStorageConfig
} = require('./storageAdapterRegistry');

/**
 * Isko node-cron ya kisi scheduler se call karna,
 * e.g. every 30 minutes.
 */
async function runAutoDeleteJob() {
  try {
    const now = new Date().toISOString();

    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .lt('expires_at', now)
      .eq('is_permanent', false);

    if (!projects?.length) {
      return { deleted: 0 };
    }

    const adapter = await getActiveStorageAdapter();
    const config = await getStorageConfig();

    let deleted = 0;

    for (const project of projects) {
      try {
        await adapter.deleteFile(
          project.file_url,
          config
        );

        await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);

        deleted++;
      } catch (err) {
        console.error('autoDeleteJob', err);
      }
    }

    return { deleted };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  runAutoDeleteJob
};
