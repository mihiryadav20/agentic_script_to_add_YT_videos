const { MongoClient } = require("mongodb");

// Function to display usage instructions
function displayUsage() {
  console.log(`
Usage: node updateVideosBySlug.js <slug> [<en_url> <hi_url> <te_url> <as_url> <kok_url> <gu_url> <ml_url> <mr_url> <mni_url> <lus_url> <or_url> <pa_url> <ta_url> <bn_url> <ks_url> <kn_url>]

Example: 
node updateVideosBySlug.js aif.json https://example.com/en.mp4 https://example.com/hi.mp4

Parameters:
  - slug: Required. The unique identifier for the document (e.g., aif.json)
  - language URLs: Optional. Video URLs for each language in order: en, hi, te, as, kok, gu, ml, mr, mni, lus, or, pa, ta, bn, ks, kn
    Leave as empty string "" for no URL for a specific language
`);
  process.exit(1);
}

async function updateVideosBySlug() {
  // MongoDB configuration
  const mongoUri = "mongodb+srv://hullagri:tESUl2VZDGklo1Io@schemes.4it1g.mongodb.net/?retryWrites=true&w=majority&appName=Schemes";
  const dbName = "Hull_Schemes";
  const collectionName = "All_agri";

  // All 16 languages to update (as specified by user)
  const languages = ["en", "hi", "te", "as", "kok", "gu", "ml", "mr", "mni", "lus", "or", "pa", "ta", "bn", "ks", "kn"];

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
  console.log(`Processing slug: ${slug}`);
  
  // Collect video URLs for each language from command line arguments
  const videoUrls = {};
  languages.forEach((lang, index) => {
    // index + 1 because args[0] is the slug
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

    // Find documents with this slug
    const docs = await collection.find({ 
      $or: [
        { "filter.slug": slug },
        { "slug": slug }
      ]
    }).toArray();
    
    if (docs.length === 0) {
      console.log(`No documents found with slug: ${slug}`);
      return;
    }
    
    console.log(`Found ${docs.length} document(s) with slug: ${slug}`);
    
    // If we have multiple documents, prioritize the one with ID 775a846c8c5442458ea4860111b28c57
    let targetDoc = docs.find(doc => doc._id === "775a846c8c5442458ea4860111b28c57");
    
    // If we didn't find the specific ID, use the first document
    if (!targetDoc && docs.length > 0) {
      targetDoc = docs[0];
    }
    
    if (!targetDoc) {
      console.log("Could not find a valid document to update");
      return;
    }
    
    console.log(`Selected document with ID: ${targetDoc._id}`);
    
    // Create update object for the languages
    const updateObject = {};
    languages.forEach(lang => {
      updateObject[`data.${lang}.media.video`] = videoUrls[lang];
    });
    
    console.log("Applying update:", JSON.stringify(updateObject, null, 2));
    
    // Update the document
    const result = await collection.updateOne(
      { _id: targetDoc._id },
      { $set: updateObject }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Successfully updated document with ID: ${targetDoc._id}`);
    } else {
      console.log(`Document found but no changes were made`);
    }
    
    // Verify the update
    const updatedDoc = await collection.findOne({ _id: targetDoc._id });
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
updateVideosBySlug().catch(console.error);
