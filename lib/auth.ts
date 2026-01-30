import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { nextCookies } from "better-auth/next-js";

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient;
  mongoDb: ReturnType<MongoClient["db"]>;
};

function getMongoDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(url);
  }
  if (!globalForMongo.mongoDb) {
    globalForMongo.mongoDb = globalForMongo.mongoClient.db();
  }
  return {
    db: globalForMongo.mongoDb,
    client: globalForMongo.mongoClient,
  };
}

const { db, client } = getMongoDb();

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db, { client }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [nextCookies()],
});

export async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}
