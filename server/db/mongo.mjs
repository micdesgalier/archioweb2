// server/db/mongo.mjs
import mongoose from 'mongoose';

const buildUri = (env) => {
  if (env.MONGO_URI) return env.MONGO_URI;
  const host = env.MONGO_HOST || 'localhost';
  const port = env.MONGO_PORT || '27017';
  const db = env.MONGO_DB || 'myappdb';
  if (env.MONGO_USER && env.MONGO_PASS) {
    return `mongodb://${encodeURIComponent(env.MONGO_USER)}:${encodeURIComponent(env.MONGO_PASS)}@${host}:${port}/${db}?authSource=admin`;
  }
  return `mongodb://${host}:${port}/${db}`;
};

export async function connectMongo(logger = console) {
  const uri = buildUri(process.env);
  logger.log('Connecting to MongoDB:', uri.replace(/\/\/.*:.*@/, '//<user>:<pass>@'));
  mongoose.set('strictQuery', false);
  try {
    await mongoose.connect(uri, {
      // options modernes ; mongoose choisit des valeurs sensées par défaut
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    logger.log('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    throw err;
  }
}

// pour fermer proprement
export async function disconnectMongo(logger = console) {
  await mongoose.disconnect();
  logger.log('MongoDB disconnected');
}