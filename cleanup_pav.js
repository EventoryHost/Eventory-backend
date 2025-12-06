const mongoose = require('mongoose');
const PhotographerVideographer = require('./models/photographerVideographer');

// Database cleanup script for PAV services
async function cleanupPAVServices() {
    try {
        // Connect to MongoDB (adjust connection string as needed)
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventory');
        
        console.log('Connected to database');
        
        // Delete all PAV services for test vendor
        const result = await PhotographerVideographer.deleteMany({
            vendor_id: "VEN20250802143022"
        });
        
        console.log(`Deleted ${result.deletedCount} PAV services for vendor VEN20250802143022`);
        
        // Optionally delete all PAV services (uncomment if needed)
        // const allResult = await PhotographerVideographer.deleteMany({});
        // console.log(`Deleted ${allResult.deletedCount} total PAV services`);
        
        await mongoose.disconnect();
        console.log('Cleanup complete');
        
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

// Run cleanup
cleanupPAVServices();
