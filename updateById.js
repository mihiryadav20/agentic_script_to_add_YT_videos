const { MongoClient } = require("mongodb");

// Function to display usage instructions
function displayUsage() {
  console.log(`
Usage: node updateById.js <document_id> [<en_url> <hi_url> <te_url> <ml_url> <ta_url> <kn_url> <mr_url> <bn_url>]

Example: 
node updateById.js 775a846c8c5442458ea4860111b28c57 https://example.com/en.mp4 https://example.com/hi.mp4

Parameters:
  - document_id: Required. The MongoDB document ID (e.g., 775a846c8c5442458ea4860111b28c57)
  - language URLs: Optional. Video URLs for each language in order: en, hi, te, ml, ta, kn, mr, bn
    Leave as empty string "" for no URL for a specific language
`);
  process.exit(1);
}

async function updateById() {
  // MongoDB configuration
  const mongoUri = "mongodb+srv://hullagri:tESUl2VZDGklo1Io@schemes.4it1g.mongodb.net/?retryWrites=true&w=majority&appName=Schemes";
  const dbName = "Hull_Schemes";
  const collectionName = "All_agri";

  // Eight languages to update
  const languages = ["en", "hi", "te", "ml", "ta", "kn", "mr", "bn"];

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Check if help is requested
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    displayUsage();
  }
  
  // Get document ID from command line
  const documentId = args[0];
  if (!documentId) {
    console.error("Error: Document ID is required");
    displayUsage();
  }
  console.log(`Processing document with ID: ${documentId}`);
  
  // Collect video URLs for each language from command line arguments
  const videoUrls = {};
  languages.forEach((lang, index) => {
    // index + 1 because args[0] is the document ID
    videoUrls[lang] = (index + 1 < args.length) ? args[index + 1] : "";
    console.log(`Using URL for ${lang}: ${videoUrls[lang] || "None"}`);
  });
  
  let mongoClient;

  try {
    // Connect to MongoDB
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log("Connected to MongoDB");
    
    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);

    // Find the document by ID
    const doc = await collection.findOne({ _id: documentId });
    
    if (!doc) {
      console.log(`No document found with ID: ${documentId}`);
      return;
    }
    
    console.log(`Found document with ID: ${doc._id}, slug: ${doc.filter?.slug || doc.slug || "N/A"}`);
    
    // Create update object for the languages
    const updateObject = {};
    languages.forEach(lang => {
      updateObject[`data.${lang}.media.video`] = videoUrls[lang];
    });
    
    console.log("Applying update:", JSON.stringify(updateObject, null, 2));
    
    // Update the document
    const result = await collection.updateOne(
      { _id: documentId },
      { $set: updateObject }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Successfully updated document with ID: ${documentId}`);
    } else {
      console.log(`Document found but no changes were made`);
    }
    
    // Verify the update
    const updatedDoc = await collection.findOne({ _id: documentId });
    console.log("\nVerifying update - Video URLs after update:");
    
    languages.forEach(lang => {
      const videoUrl = updatedDoc.data && 
                      updatedDoc.data[lang] && 
                      updatedDoc.data[lang].media && 
                      updatedDoc.data[lang].media.video || "Not found";
      console.log(`${lang}: ${videoUrl}`);
    });

  } catch (error) {
    console.error("Error updating MongoDB:", error.message);
  } finally {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
      console.log("\nMongoDB connection closed");
    }
  }
}

// Run the script
updateById().catch(console.error);
