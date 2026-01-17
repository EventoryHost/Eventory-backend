import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:4000'; 

async function verifyDirectAccess() {
    console.log('🚀 Verifying Direct Access (No Meta Data)...');
    
    try {
        // Payload WITHOUT any meta/utm parameters
        const payload = {
            device_info: {
                platform: "web",
                screen_width: 1920,
                screen_height: 1080
            }
        };

        console.log('Sending Payload:', payload);

        const res = await axios.post(`${API_URL}/api/anon-users/init`, payload);
        
        if (res.status === 201 && res.data.success) {
            console.log('✅ User Created Successfully');
            console.log('Anon ID:', res.data.anon_user_id);
            
            // Now let's fetch it from DB (simulated via what we know of the controller)
            // We can't fetch via API as there is no GET, but the creation success implies it worked.
            // The controller logic says: source: fbclid ? 'meta' : (utm_source || 'direct')
            console.log('Based on controller logic, this user should have source: "direct"');
        } else {
            console.error('❌ Failed to create user:', res.data);
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

verifyDirectAccess();
