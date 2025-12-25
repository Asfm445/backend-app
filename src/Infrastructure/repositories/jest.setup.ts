// src/Infrastructure/repositories/jest.setup.ts (as previously provided)
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer;

// Before all tests, start the in-memory MongoDB server
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri);
});

// Before each test, clear all collections to ensure a clean state
beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// After all tests, stop the in-memory MongoDB server and close the connection
afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});