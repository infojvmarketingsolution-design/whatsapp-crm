const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const startMediaCleanupJob = () => {
  // Run every day at 3:00 AM
  cron.schedule('0 3 * * *', () => {
    console.log('[Media Cleanup] Starting scheduled media cleanup job...');
    const mediaDir = path.join(__dirname, '../../../public/uploads/media');
    
    if (!fs.existsSync(mediaDir)) {
      console.log('[Media Cleanup] Media directory does not exist. Skipping.');
      return;
    }

    const MAX_AGE_DAYS = 15;
    const now = Date.now();
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    let errorCount = 0;

    try {
      // The media folder is structured as: public/uploads/media/{tenantId}/{fileName}
      const tenants = fs.readdirSync(mediaDir);
      
      for (const tenant of tenants) {
        const tenantDir = path.join(mediaDir, tenant);
        const stats = fs.statSync(tenantDir);
        
        if (stats.isDirectory()) {
          const files = fs.readdirSync(tenantDir);
          
          for (const file of files) {
             const filePath = path.join(tenantDir, file);
             try {
                const fileStats = fs.statSync(filePath);
                
                if (fileStats.isFile()) {
                   const fileAge = now - fileStats.mtimeMs;
                   if (fileAge > maxAgeMs) {
                      fs.unlinkSync(filePath);
                      deletedCount++;
                      console.log(`[Media Cleanup] Deleted old file: ${tenant}/${file}`);
                   }
                }
             } catch (fileErr) {
                console.error(`[Media Cleanup] Failed to check/delete file ${filePath}:`, fileErr.message);
                errorCount++;
             }
          }
        }
      }

      console.log(`[Media Cleanup] Job finished. Deleted ${deletedCount} files. Errors: ${errorCount}`);
    } catch (err) {
      console.error('[Media Cleanup] Fatal error during cleanup run:', err.message);
    }
  });

  console.log('[Media Cleanup] Scheduled 15-day media deletion job to run daily at 3:00 AM');
};

module.exports = {
  startMediaCleanupJob
};
