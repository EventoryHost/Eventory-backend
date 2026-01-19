import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:4000'; // Port from .env
const ANON_ID = 'ANON_TEST_' + Date.now();

async function runTest() {
  console.log('🚀 Starting Anonymous Chat Test');
  console.log('👤 Anonymous ID:', ANON_ID);

  try {
    // 1. Check Status (Should be NONE)
    console.log('\n1️⃣ Checking Initial Status...');
    try {
        const statusRes = await axios.get(`${API_URL}/api/anon-chats/${ANON_ID}/status`);
        console.log('Status:', statusRes.data);
    } catch (e) {
        console.log('Status Check Error (Expected if 404/400? No, should return NONE):', e.message);
    }

    // 2. Send First Message (REST) - Should create Chat
    console.log('\n2️⃣ Sending First Message (REST)...');
    const msgRes = await axios.post(`${API_URL}/api/anon-chats/message`, {
      anon_customer_id: ANON_ID,
      message_content: 'Hello from test script! (REST)',
      message_type: 'text',
      metadata: { source: 'test_script' }
    });
    console.log('✅ Message Sent (REST)');
    console.log('Response Data:', msgRes.data);
    
    const chatId = msgRes.data.chat_id;
    if (!chatId) {
        throw new Error('Chat ID not returned from create message!');
    }
    console.log('🆔 Chat ID Created:', chatId);

    // 3. Check Status (Should be ACTIVE)
    console.log('\n3️⃣ Checking Status After Message...');
    const statusRes2 = await axios.get(`${API_URL}/api/anon-chats/${ANON_ID}/status`);
    console.log('Status:', statusRes2.data);

    // 4. Fetch Messages (REST)
    console.log('\n4️⃣ Fetching Message History...');
    const historyRes = await axios.get(`${API_URL}/api/anon-chats/${ANON_ID}/messages`);
    console.log(`✅ Found ${historyRes.data.messages.length} messages`);
    console.log('Latest Message:', historyRes.data.messages[0]?.message_content);

    // 5. WebSocket Test
    console.log('\n5️⃣ Testing WebSocket Connection...');
    const socket = io(API_URL);

    socket.on('connect', () => {
      console.log('🔌 Socket Connected:', socket.id);

      // Join Chat
      console.log(`Joining Chat Room: ${chatId}-anon_customer-admin`);
      socket.emit('join_chat', {
        chat_id: chatId,
        sender: 'anonymous_customer',
        chat_type: 'anon_customer-admin'
      });
    });

    socket.on('joined', (msg) => {
      console.log('✅ Joined Room Event:', msg);

      // Send Socket Message
      console.log('Sending Socket Message...');
      socket.emit('send_message', {
        chat_id: chatId,
        chat_type: 'anon_customer-admin',
        sender: 'anonymous_customer',
        sender_id: ANON_ID,
        message_content: 'Hello via WebSocket!',
        message_type: 'text'
      }, (err, response) => {
        if (err) {
            console.error('❌ Socket Message Error:', err);
        } else {
            console.log('✅ Socket Message Ack:', response);
        }
      });
    });

    socket.on('new_message', (msg) => {
        console.log('📩 Received New Message via Socket:', msg.message_content);
        if (msg.message_content === 'Hello via WebSocket!') {
            console.log('✅ Verified own message receipt via socket.');
            
            console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
            console.log('You can verify in DB:');
            console.log(`Chat ID: ${chatId}`);
            console.log(`Anon Customer ID: ${ANON_ID}`);
            
            socket.close();
            process.exit(0);
        }
    });

    socket.on('error', (err) => {
        console.error('❌ Socket Error:', err);
    });
    
    // Timeout fallback
    setTimeout(() => {
        console.log('⚠️ Test timed out waiting for socket events.');
        socket.close();
        process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ Test Failed!');
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
        console.error('No response received. Request:', error.request);
    } else {
        console.error('Error Message:', error.message);
    }
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runTest();
