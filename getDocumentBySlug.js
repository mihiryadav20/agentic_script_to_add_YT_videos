require('dotenv').config();
const { MongoClient } = require("mongodb");

// Function to display usage instructions
function displayUsage() {
  console.log(`
Usage: node getDocumentBySlug.js <slug>

Example: 
node getDocumentBySlug.js aif.json

Parameters:
  - slug: Required. The unique identifier for the document (e.g., aif.json)
`);
  process.exit(1);
}

async function getDocumentBySlug() {
  // MongoDB configuration
  const mongoUri = process.env.MONGO_URI;
  const dbName = "Hull_Schemes";
  const collectionName = "All_agri";

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Check if help is requested or no arguments provided
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    displayUsage();
  }
  
  // Get slug from command line
  const slug = args[0];
  if (!slug) {
    console.error("Error: Slug is required");
    displayUsage();
  }
  console.log(`Searching for document with slug: ${slug}`);
  
  let mongoClient;

  try {
    // Connect to MongoDB
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log("Connected to MongoDB");
    
    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);

    // Search for documents with the given slug
    console.log("Searching by filter.slug...");
    const docByFilterSlug = await collection.findOne({ "filter.slug": slug });
    
    console.log("Searching by slug (direct field)...");
    const docByDirectSlug = await collection.findOne({ "slug": slug });
    
    // Display results
    console.log("\n=== Results ===\n");
    
    if (docByFilterSlug) {
      console.log("Document found by filter.slug:");
      console.log(JSON.stringify(docByFilterSlug, null, 2));
    } else {
      console.log("No document found with filter.slug =", slug);
    }
    
    console.log("\n---\n");
    
    if (docByDirectSlug) {
      console.log("Document found by direct slug field:");
      console.log(JSON.stringify(docByDirectSlug, null, 2));
    } else {
      console.log("No document found with slug =", slug);
    }
    
    // Count total documents with this slug (in any form)
    const count = await collection.countDocuments({
      $or: [
        { "filter.slug": slug },
        { "slug": slug }
      ]
    });
    
    console.log(`\nTotal documents matching this slug (in any form): ${count}`);
    
    // List all documents in the collection (limited to 10)
    console.log("\nListing up to 10 documents in the collection:");
    const allDocs = await collection.find({}).limit(10).toArray();
    console.log(`Found ${allDocs.length} documents in total`);
    
    // Print just the slugs and IDs for reference
    console.log("\nDocument IDs and slugs:");
    allDocs.forEach(doc => {
      const filterSlug = doc.filter && doc.filter.slug ? doc.filter.slug : "N/A";
      const directSlug = doc.slug || "N/A";
      console.log(`ID: ${doc._id}, filter.slug: ${filterSlug}, slug: ${directSlug}`);
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
getDocumentBySlug().catch(console.error);
