const { startServer } = require('../server');
const { disconnectDB } = require('../config/db');
const axios = require('axios');

async function testE2E() {
  console.log('[E2E Test] Starting backend and connecting DB...');
  process.env.NODE_ENV = 'test';
  process.env.ML_SERVICE_URL = 'http://127.0.0.1:8000';

  const server = await startServer();
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}/api`;

  try {
    // Register and seed user
    console.log('1. Registering user for E2E ML test...');
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'ML Test User',
      email: 'mluser@progressiq.dev',
      password: 'password123',
    });
    const token = regRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    console.log('2. Seeding 14 days of historical activity data...');
    await axios.post(`${baseURL}/auth/seed`, {}, authHeaders);

    // Call ML Consistency Prediction
    console.log('3. Requesting 7-Day Habit Consistency ML Prediction...');
    const predRes = await axios.post(`${baseURL}/predictions/consistency`, {}, authHeaders);
    console.log('   Prediction Response Status:', predRes.data.success);
    console.log('   Predicted Probability:', predRes.data.prediction.prediction);
    console.log('   Category:', predRes.data.prediction.category);
    console.log('   Model Version:', predRes.data.prediction.model_version);
    console.log('   Contributing Factors Count:', predRes.data.prediction.contributing_factors.length);
    console.log('   Sample Factor:', predRes.data.prediction.contributing_factors[0]);
    console.log('   Sample Recommendation:', predRes.data.prediction.recommendations[0]);

    // Call ML Goal Prediction
    console.log('4. Requesting Goal Completion ML Prediction...');
    const goalsRes = await axios.get(`${baseURL}/goals`, authHeaders);
    const activeGoal = goalsRes.data.goals[0];

    const goalPredRes = await axios.post(`${baseURL}/predictions/goal`, {
      goalId: activeGoal._id,
    }, authHeaders);
    console.log('   Goal Prediction Probability:', goalPredRes.data.prediction.prediction);
    console.log('   Goal Category:', goalPredRes.data.prediction.category);
    console.log('   Goal Contributing Factors:', goalPredRes.data.prediction.contributing_factors.length);

    // Check prediction history in MongoDB
    console.log('5. Verifying MongoDB PredictionHistory collection...');
    const historyRes = await axios.get(`${baseURL}/predictions/history`, authHeaders);
    console.log('   Saved history records count:', historyRes.data.count);

    if (historyRes.data.count >= 2) {
      console.log('\n[SUCCESS] End-to-end integration test between Node.js and Python ML Service PASSED 100%!');
    } else {
      throw new Error('Expected at least 2 saved predictions in MongoDB history');
    }
  } catch (err) {
    console.error('\n[E2E TEST FAILED]:', err.response ? err.response.data : err.message);
    process.exit(1);
  } finally {
    server.close();
    await disconnectDB();
    process.exit(0);
  }
}

testE2E();
