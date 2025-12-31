import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { MongoClient } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env from the server directory (adjust '../server/.env' if your .env path differs)
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

(async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn("⚠️  MONGODB_URI not set — using localhost fallback");
    }
    await client.connect();
    console.log("✅ Connected to MongoDB");
  } catch (e) {
    console.error("❌ Connection failed:", e.message);
  } finally {
    try {
      await client.close();
      console.log("🔒 Connection closed");
    } catch (closeErr) {
      console.error("❌ Error closing connection:", closeErr.message);
    }
  }
})();