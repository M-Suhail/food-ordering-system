import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGO_URL!;
const client = new MongoClient(uri);

let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (!db) {
    await client.connect();
    db = client.db('delivery');
  }
  return db;
}
