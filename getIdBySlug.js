const { MongoClient } = require("mongodb");

// Function to display usage instructions
function displayUsage() {
  console.log(`
Usage: node getIdBySlug.js <slug>

Example: 
node getIdBySlug.js aif.json

Parameters:
  - slug: Required. The unique identifier for the document (e.g., aif.json)
`);
  process.exit(1);
}

async function getIdBySlug() {
  // MongoDB configuration
  const mongoUri = "mongodb+srv://hullagri:tESUl2VZDGklo1Io@schemes.4it1g.mongodb.net/?retryWrites=true&w=majority&appName=Schemes";
  const dbName = "Hull_Schemes";
  const collectionName = "All_agri";

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Check if help is requested
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    displayUsage();
  }
  
  // Get slug from command line
  const slug = args[0];
  if (!slug) {
    console.error("Error: Slug is required");
    displayUsage();
  }
  
  let mongoClient;

  try {
    // Connect to MongoDB
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    
    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);

    // Search for documents with the given slug
    const docs = await collection.find({ 
      $or: [
        { "filter.slug": slug },
        { "slug": slug }
      ]
    }, {
      projection: {
        "_id": 1,
        "filter.slug": 1,
        "slug": 1,
        "state": 1
      }
    }).toArray();
    
    if (docs.length === 0) {
      console.log(`No documents found with slug: ${slug}`);
      return;
    }
    
    console.log(`Found ${docs.length} document(s) with slug: ${slug}\n`);
    
    // Print the results in a table format
    console.log("ID | State | Slug Type");
    console.log("-".repeat(80));
    
    docs.forEach(doc => {
      const id = doc._id;
      const state = doc.state || "N/A";
      const slugType = doc.filter && doc.filter.slug ? "filter.slug" : "slug";
      
      // Highlight the specific ID we're looking for
      const highlight = id === "775a846c8c5442458ea4860111b28c57" ? " (TARGET)" : "";
      
      console.log(`${id}${highlight} | ${state} | ${slugType}`);
      
      // If this is the target ID, make it very clear
      if (id === "775a846c8c5442458ea4860111b28c57") {
        console.log("\n>>> THIS IS THE TARGET DOCUMENT ID <<<\n");
      }
    });
    
    // If we found the specific ID we're looking for, return it for easy copying
    const targetDoc = docs.find(doc => doc._id === "775a846c8c5442458ea4860111b28c57");
    if (targetDoc) {
      console.log("\nTarget ID for use with updateById.js:");
      console.log("775a846c8c5442458ea4860111b28c57");
    }

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
getIdBySlug().catch(console.error);
