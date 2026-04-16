const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://suhrob:09012005@cluster0.oyvnhb5.mongodb.net/foodmap?retryWrites=true&w=majority";

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("✅ MongoDB ulandi!");
  } catch (error) {
    console.error("❌ Xato:", error);
  } finally {
    await client.close();
  }
}

run();
