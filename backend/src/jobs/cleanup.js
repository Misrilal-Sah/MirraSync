/**
 * MirraSync Cloudinary Cleanup
 * Deletes uploaded files older than 7 days to manage storage.
 */

const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure cloudinary (should already be configured in server.js, but just in case)
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function cleanupOldUploads() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

    logger.info('cleanup', `Starting Cloudinary cleanup for files older than ${cutoffDate}`);

    let totalDeleted = 0;
    let nextCursor = null;

    do {
      // Fetch resources uploaded before cutoff
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'mirrasync/', // adjust if your uploads use a different prefix
        max_results: 100,
        next_cursor: nextCursor,
      });

      const oldResources = result.resources.filter(r => {
        const uploadDate = new Date(r.created_at);
        return uploadDate < sevenDaysAgo;
      });

      if (oldResources.length > 0) {
        const publicIds = oldResources.map(r => r.public_id);
        await cloudinary.api.delete_resources(publicIds);
        totalDeleted += publicIds.length;
        logger.info('cleanup', `Deleted ${publicIds.length} old files from Cloudinary`);
      }

      nextCursor = result.next_cursor;
    } while (nextCursor);

    logger.info('cleanup', `Cloudinary cleanup complete. Total deleted: ${totalDeleted}`);
    return totalDeleted;
  } catch (err) {
    logger.error('cleanup', 'Cloudinary cleanup failed', { error: err.message, stack: err.stack });
    return 0;
  }
}

/**
 * Start cleanup interval — runs every 24 hours
 */
function startCleanupScheduler() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Run once on startup (with 30s delay to let server finish booting)
  setTimeout(() => {
    cleanupOldUploads();
  }, 30000);

  // Then every 24 hours
  setInterval(() => {
    cleanupOldUploads();
  }, TWENTY_FOUR_HOURS);

  logger.info('cleanup', 'Cloudinary cleanup scheduler started (runs every 24h)');
}

module.exports = { cleanupOldUploads, startCleanupScheduler };
