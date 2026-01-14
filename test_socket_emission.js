import io from 'socket.io-client';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:4000'; // Adjust port if needed
const ANON_ID = 'ANON_TEST_SOCKET_' + Date.now();

async function testSocketEmission() {
    console.log('🚀 Starting Socket Emission Test');
    
    // 1. Initialize User (REST)
    try {
        const initRes = await axios.post(`${API_URL}/api/anon-users/init`, {
            utm_source: 'test_socket'
        });
        const anonId = initRes.data.anon_user_id;
        console.log('Initialized Anon ID:', anonId);

        // Get Chat ID (from status or init)
        // Actually, init doesn't return chat_id directly unless we check status
        const statusRes = await axios.get(`${API_URL}/api/anon-chats/${anonId}/status`);
        const chatId = statusRes.data.chat_id;
        console.log('Chat ID:', chatId);

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
            
            // 3. Send "Birthday Party" (SOCKET)
            console.log('Sending "Birthday Party" via SOCKET...');
            socket.emit('send_message', {
                chat_id: chatId,
                chat_type: 'anon_customer-admin',
                sender: 'anonymous_customer',
                sender_id: anonId,
                message_content: "Birthday Party",
                message_type: "text"
            }, (err, response) => {
                if (err) console.error('Socket Send Error:', err);
                else console.log('✅ Socket Send Ack Received');
            });
        });

        socket.on('new_message', (msg) => {
            console.log('📩 Received Socket Message:', msg.message_content);
            
            if (msg.message_content === 'How soon is your event?') {
                console.log('✅ SUCCESS: Received auto-reply via socket!');
                socket.disconnect();
                process.exit(0);
            }
        });

        // Timeout
        setTimeout(() => {
            console.log('⚠️ Timeout waiting for socket message');
            socket.disconnect();
            process.exit(1);
        }, 5000);

    } catch (error) {
        console.error('Test Failed:', error.message);
        process.exit(1);
    }
}

testSocketEmission();
