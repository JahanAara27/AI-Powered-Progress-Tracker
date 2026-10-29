const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`[MongoDB] Primary connection failed: ${err.message}. Falling back to memory database for local demo...`);
    }
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri);
    console.log(`[MongoDB] Connected to in-memory MongoDB instance at ${memUri}`);
  } catch (err) {
    console.error(`[MongoDB] Fatal error initializing database: ${err.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = { connectDB, disconnectDB };
