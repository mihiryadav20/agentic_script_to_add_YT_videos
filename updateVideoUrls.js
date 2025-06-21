const { MongoClient } = require("mongodb");

// Function to display usage instructions
function displayUsage() {
  console.log(`
Usage: node updateVideoUrls.js <slug> [<en_url> <hi_url> <te_url> <ml_url> <ta_url> <kn_url> <mr_url> <bn_url>]

Example: 
node updateVideoUrls.js aif.json https://example.com/en.mp4 https://example.com/hi.mp4

Parameters:
  - slug: Required. The unique identifier for the document (e.g., aif.json)
  - language URLs: Optional. Video URLs for each language in order: en, hi, te, ml, ta, kn, mr, bn
    Leave as empty string "" for no URL for a specific language
`);
  process.exit(1);
}

async function updateVideoUrls() {
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

    // Check both slug formats
    const docByFilterSlug = await collection.findOne({ "filter.slug": slug });
    const docByDirectSlug = await collection.findOne({ "slug": slug });
    
    if (!docByFilterSlug && !docByDirectSlug) {
      console.log(`No document found with slug: ${slug}`);
      return;
    }
    
    // Determine which document to update
    const doc = docByFilterSlug || docByDirectSlug;
    const slugField = docByFilterSlug ? "filter.slug" : "slug";
    
    console.log(`Found document with ID: ${doc._id}, using ${slugField} field`);
    
    // Create update operations based on document structure
    let updateOperation;
    
    if (docByFilterSlug) {
      // Document has filter.slug structure
      const updateObject = {};
      languages.forEach(lang => {
        updateObject[`data.${lang}.media.video`] = videoUrls[lang];
      });
      
      updateOperation = {
        $set: updateObject
      };
    } else {
      // Document has direct slug structure
      const updateObject = {};
      languages.forEach(lang => {
        updateObject[`data.${lang}.media.video`] = videoUrls[lang];
      });
      
      updateOperation = {
        $set: updateObject
      };
    }
    
    console.log("Applying update:", JSON.stringify(updateOperation, null, 2));
    
    // Update the document
    const result = await collection.updateOne(
      { _id: doc._id },
      updateOperation
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Successfully updated document with slug: ${slug}`);
    } else {
      console.log(`Document found but no changes were made`);
    }
    
    // Verify the update
    const updatedDoc = await collection.findOne({ _id: doc._id });
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
updateVideoUrls().catch(console.error);
