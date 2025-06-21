require('dotenv').config();
const { MongoClient } = require("mongodb");

async function listAllSlugs() {
  // MongoDB configuration
  const mongoUri = process.env.MONGO_URI;
  const dbName = "Hull_Schemes";
  const collectionName = "All_agri";
  
  let mongoClient;

  try {
    // Connect to MongoDB
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log("Connected to MongoDB");
    
    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);

    // Get all documents, but only fetch the fields we need
    const docs = await collection.find({}, { 
      projection: { 
        "_id": 1, 
        "filter.slug": 1, 
        "slug": 1,
        "state": 1
      } 
    }).toArray();
    
    console.log(`Found ${docs.length} documents in total\n`);
    
    // Print the slugs in a table format
    console.log("ID | State | filter.slug | slug");
    console.log("-".repeat(80));
    
    docs.forEach(doc => {
      const id = doc._id;
      const state = doc.state || "N/A";
      const filterSlug = doc.filter && doc.filter.slug ? doc.filter.slug : "N/A";
      const directSlug = doc.slug || "N/A";
      
      console.log(`${id} | ${state} | ${filterSlug} | ${directSlug}`);
    });

  } catch (error) {
    console.error("Error querying MongoDB:", error.message);
  } finally {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
      console.log("\nMongoDB connection closed");
    }
  }
}

// Run the script
listAllSlugs().catch(console.error);
