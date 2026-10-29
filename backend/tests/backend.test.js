const { app, startServer } = require('../server');
const { disconnectDB } = require('../config/db');
const axios = require('axios');

async function runTests() {
  console.log('[Backend Test] Starting server and database...');
  process.env.NODE_ENV = 'test';
  
  const server = await startServer();
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}/api`;

  try {
    // 1. Health check
    console.log('1. Testing /health...');
    const healthRes = await axios.get(`${baseURL}/health`);
    console.log('   Health status:', healthRes.data.status);

    // 2. Register
    console.log('2. Testing /auth/register...');
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'Test Engineer',
      email: 'engineer@progressiq.dev',
      password: 'password123',
    });
    const token = regRes.data.token;
    console.log('   Registered successfully. Token received:', !!token);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Get /auth/me
    console.log('3. Testing /auth/me...');
    const meRes = await axios.get(`${baseURL}/auth/me`, authHeaders);
    console.log('   User email:', meRes.data.user.email);

    // 4. Create Habit
    console.log('4. Testing POST /habits...');
    const habitRes = await axios.post(`${baseURL}/habits`, {
      title: 'Daily Code Review',
      description: 'Review pull requests and architecture',
      frequency: 'daily',
    }, authHeaders);
    const habitId = habitRes.data.habit._id;
    console.log('   Created habit id:', habitId);

    // 5. Check-in
    console.log('5. Testing POST /checkins...');
    const today = new Date().toISOString().split('T')[0];
    const checkinRes = await axios.post(`${baseURL}/checkins`, {
      habitId,
      date: today,
      status: 'completed',
      practiceMinutes: 45,
    }, authHeaders);
    console.log('   Check-in created with streak:', checkinRes.data.habitStats.currentStreak);

    // 6. Create Goal
    console.log('6. Testing POST /goals...');
    const goalRes = await axios.post(`${baseURL}/goals`, {
      title: 'Deploy Production Cloud Infrastructure',
      targetDate: '2026-12-31',
      milestones: [
        { title: 'Provision VPC', completed: true },
        { title: 'Setup Kubernetes Cluster', completed: false },
      ],
    }, authHeaders);
    console.log('   Goal created with completion %:', goalRes.data.goal.completionPercentage);

    // 7. Test Analytics
    console.log('7. Testing GET /analytics/dashboard...');
    const dashRes = await axios.get(`${baseURL}/analytics/dashboard`, authHeaders);
    console.log('   Dashboard total habits:', dashRes.data.data.totalHabits);
    console.log('   Dashboard today rate %:', dashRes.data.data.todayCompletionRate);

    // 8. Test Demo Seed
    console.log('8. Testing POST /auth/seed...');
    const seedRes = await axios.post(`${baseURL}/auth/seed`, {}, authHeaders);
    console.log('   Seed message:', seedRes.data.message);

    // 9. Verify dashboard with seeded data
    const seededDash = await axios.get(`${baseURL}/analytics/dashboard`, authHeaders);
    console.log('   Seeded habits count:', seededDash.data.data.totalHabits);
    console.log('   Seeded weekly summaries count:', seededDash.data.data.weeklyActivitySummary.length);

    console.log('\n[SUCCESS] All backend integration tests passed perfectly!');
  } catch (err) {
    console.error('\n[TEST FAILED]:', err.response ? err.response.data : err.message);
    process.exit(1);
  } finally {
    server.close();
    await disconnectDB();
    process.exit(0);
  }
}

runTests();
