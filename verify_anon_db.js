import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AnonymousUser from './models/anonymousUser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function verifyAnonInDB() {
    console.log('🚀 Connecting to MongoDB to verify Anonymous User...');
    
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI not found in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to DB');

        // The ID from the previous test run
        const targetId = "ANON14012026212715828EB3ADF"; 
        
        console.log(`🔍 Searching for Anon ID: ${targetId}`);
        const user = await AnonymousUser.findOne({ anon_id: targetId });

        if (user) {
            console.log('✅ User Found in DB!');
            console.log('---------------------------------------------------');
            console.log(JSON.stringify(user.toObject(), null, 2));
            console.log('---------------------------------------------------');
            console.log('Acquisition Data:', user.acquisition);
        } else {
            console.error('❌ User NOT found in DB. Please check if you are connecting to the correct database.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyAnonInDB();
