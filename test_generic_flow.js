import io from 'socket.io-client';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:4000'; 

async function testGenericFlow() {
    console.log('🚀 Starting Generic Flow Test');
    
    try {
        // 1. Initialize User
        const initRes = await axios.post(`${API_URL}/api/anon-users/init`, { utm_source: 'test_generic' });
        const anonId = initRes.data.anon_user_id;
        const statusRes = await axios.get(`${API_URL}/api/anon-chats/${anonId}/status`);
        const chatId = statusRes.data.chat_id;
        console.log(`Initialized: ${anonId}`);

        // 2. Connect Socket
        const socket = io(API_URL);
        
        socket.on('connect', () => {
            console.log('🔌 Socket Connected');
            socket.emit('join_chat', {
                chat_id: chatId,
                sender: 'anonymous_customer',
                chat_type: 'anon_customer-admin'
            });
        });

        socket.on('joined', () => {
            console.log('✅ Joined Chat Room');
            
            // 3. Send "Other" (Should NOT trigger follow-up)
            console.log('Sending "Other"...');
            socket.emit('send_message', {
                chat_id: chatId,
                chat_type: 'anon_customer-admin',
                sender: 'anonymous_customer',
                sender_id: anonId,
                message_content: "Other",
                message_type: "text"
            });

            // Wait a bit to ensure no auto-reply comes
            setTimeout(() => {
                // 4. Send "Concert" (Should trigger "How soon?")
                console.log('Sending "Concert"...');
                socket.emit('send_message', {
                    chat_id: chatId,
                    chat_type: 'anon_customer-admin',
                    sender: 'anonymous_customer',
                    sender_id: anonId,
                    message_content: "Concert",
                    message_type: "text"
                });
            }, 1000);
        });

        socket.on('new_message', (msg) => {
            console.log(`📩 Received: ${msg.message_content}`);
            
            if (msg.message_content === "How soon is your event?") {
                console.log('✅ SUCCESS: Received "How soon?" after "Concert"');
                socket.disconnect();
                process.exit(0);
            }
        });

        // Timeout
        setTimeout(() => {
            console.log('⚠️ Timeout');
            socket.disconnect();
            process.exit(1);
        }, 8000);

    } catch (error) {
        console.error('Test Failed:', error.message);
        process.exit(1);
    }
}

testGenericFlow();
