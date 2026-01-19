import axios from 'axios';

const API_URL = 'http://localhost:4000'; // Port from .env

async function runTest() {
  console.log('🚀 Starting Anonymous User Update Test');

  try {
    // 1. Create New User
    console.log('\n1️⃣ Creating New User...');
    const initRes = await axios.post(`${API_URL}/api/anon-users/init`, {
        source: 'direct_test',
        landing_page: '/home'
    });
    
    const anonId = initRes.data.anon_user_id;
    console.log('✅ Created User:', anonId);
    console.log('Initial Response:', initRes.data);

    if (!anonId) throw new Error('No anon_id returned');

    // 2. Update Existing User (Simulate coming from Meta Ad)
    console.log('\n2️⃣ Updating User with Meta Data...');
    const updateRes = await axios.post(`${API_URL}/api/anon-users/init`, {
        anon_id: anonId,
        source: 'meta_test',
        fbclid: 'test_fbclid_123',
        utm_campaign: 'summer_sale'
    });

    console.log('✅ Update Response:', updateRes.data);

    // Verification
    if (updateRes.data.anon_user_id !== anonId) {
        throw new Error(`❌ ID Mismatch! Expected ${anonId}, got ${updateRes.data.anon_user_id}`);
    }

    if (updateRes.data.message !== 'Anonymous user updated') {
        throw new Error(`❌ Unexpected message: ${updateRes.data.message}`);
    }

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ Test Failed!');
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
        console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

runTest();
