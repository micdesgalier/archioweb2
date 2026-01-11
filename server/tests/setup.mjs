// tests/setup.mjs
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

let mongod;

export async function startInMemoryMongo() {
  mongod = await MongoMemoryServer.create({ instance: { dbName: 'testdb' } });
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  return { uri };
}

export async function stopInMemoryMongo() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}