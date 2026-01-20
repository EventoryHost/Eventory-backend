import io from 'socket.io-client';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:4000'; 

async function testVendorFlow() {
    console.log('🚀 Starting Vendor Flow Test');
    
    try {
        // 1. Initialize User
        const initRes = await axios.post(`${API_URL}/api/anon-users/init`, { utm_source: 'test_vendor' });
        const anonId = initRes.data.anon_user_id;
        const statusRes = await axios.get(`${API_URL}/api/anon-chats/${anonId}/status`);
        const chatId = statusRes.data.chat_id;
        console.log(`Initialized: ${anonId} | Chat: ${chatId}`);

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
            
            // 3. Simulate User LIKING a Vendor
            console.log('👍 Liking Vendor...');
            socket.emit('send_message', {
                chat_id: chatId,
                chat_type: 'anon_customer-admin',
                sender: 'anonymous_customer',
                sender_id: anonId,
                message_content: "LIKE_VENDOR:VEN123",
                message_type: "text" // Button clicks are sent as text usually, or we can use 'action'
            });
        });

        socket.on('new_message', (msg) => {
            console.log(`📩 Received: [${msg.message_type}] ${msg.message_content}`);
            
            if (msg.message_type === 'order_summary') {
                console.log('✅ Order Summary Received');
                console.log('Card Data:', JSON.stringify(msg.card_data));
            }

            if (msg.message_content.includes("proceed with this order")) {
                console.log('✅ Confirmation Options Received');
                
                // 4. Confirm Order
                console.log('✅ Confirming Order...');
                socket.emit('send_message', {
                    chat_id: chatId,
                    chat_type: 'anon_customer-admin',
                    sender: 'anonymous_customer',
                    sender_id: anonId,
                    message_content: "CONFIRM_ORDER:VEN123",
                    message_type: "text"
                });
            }

            if (msg.message_type === 'login_prompt') {
                console.log('✅ Login Prompt Received');
                console.log('🎉 Test Passed!');
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

testVendorFlow();
