import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:4000'; 

async function verifyAnonCreation() {
    console.log('🚀 Verifying Anonymous User Creation with Meta Data');
    
    try {
        const payload = {
            fbclid: "test_fbclid_123",
            utm_source: "facebook",
            utm_medium: "cpc",
            utm_campaign: "summer_sale",
            device_info: {
                platform: "mobile",
                screen_width: 390,
                screen_height: 844
            }
        };

        console.log('Sending Payload:', payload);

        const res = await axios.post(`${API_URL}/api/anon-users/init`, payload);
        
        if (res.status === 201 && res.data.success) {
            console.log('✅ User Created Successfully');
            console.log('Anon ID:', res.data.anon_user_id);
            console.log('NOTE: Please check the "anonymous_users" collection in your MongoDB to confirm this ID exists with the metadata.');
        } else {
            console.error('❌ Failed to create user:', res.data);
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

verifyAnonCreation();
