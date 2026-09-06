import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL;

if (!uri) {
  throw new Error("DATABASE_URL is not set");
}

const client = new MongoClient(uri, {
  tls: true,
  serverSelectionTimeoutMS: 10000,
  family: 4,
});

try {
  console.log("Connecting to MongoDB...");

  await client.connect();

  await client.db().command({
    ping: 1,
  });

  console.log("✅ MongoDB connection successful!");
} catch (error) {
  console.error("❌ MongoDB connection failed:");
  console.error(error);
} finally {
  await client.close();
}