import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function initMongo() {
  if (db) return db;

  const uri = process.env.MONGO_URL!;
  client = new MongoClient(uri);
  await client.connect();

  db = client.db('notification');
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('MongoDB not initialized');
  return db;
}
