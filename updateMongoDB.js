require('dotenv').config();
const { MongoClient } = require("mongodb");

// Function to display usage instructions
function displayUsage() {
  console.log(`
Usage: node updateMongoDB.js <slug> [<en_url> <hi_url> <te_url> <ml_url> <ta_url> <kn_url> <mr_url> <bn_url>]

Example: 
node updateMongoDB.js aif.json https://example.com/en.mp4 https://example.com/hi.mp4

Parameters:
  - slug: Required. The unique identifier for the document (e.g., aif.json)
  - language URLs: Optional. Video URLs for each language in order: en, hi, te, ml, ta, kn, mr, bn
    Leave as empty string "" for no URL for a specific language
`);
  process.exit(1);
}

async function manuallyUpdateMongoDB() {
  // MongoDB configuration
  const mongoUri = process.env.MONGO_URI;
  const dbName = "Hull_Schemes";
  const collectionName = "All_agri";

  // Eight languages to update
  const languages = ["en", "hi", "te", "ml", "ta", "kn", "mr", "bn"];

  // Default image URL - using empty string to match existing data
  const defaultImageUrl = ""; // Using empty string instead of default_image.jpg

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
    // Create update object for the eight languages
    const updateObject = {};
    languages.forEach(lang => {
      updateObject[`data.${lang}.media.video`] = videoUrls[lang];
      updateObject[`data.${lang}.media.image`] = defaultImageUrl;
    });

    // Connect to MongoDB
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);

    // Create index on filter.slug for performance
    await collection.createIndex({ "filter.slug": 1 });

    // First, check if the document exists and print its structure
    const existingDoc = await collection.findOne({ "filter.slug": slug });
    console.log("Existing document:", existingDoc ? JSON.stringify(existingDoc, null, 2) : "Not found");
    
    // Update or insert MongoDB document
    console.log("Updating with:", JSON.stringify(updateObject, null, 2));
    
    const result = await collection.updateOne(
      { "filter.slug": slug },
      {
        $set: {
          "filter.slug": slug,
          ...updateObject
        }
      },
      { upsert: true }
    );

    if (result.modifiedCount > 0) {
      console.log(`Updated document for slug: ${slug}`);
    }
    if (result.upsertedCount > 0) {
      // Set additional fields for new document
      const newDocument = {
        _id: result.upsertedId,
        state: "unknown",
        filter: { slug: slug, data: {} },
        states: ["unknown"],
        rating: 1,
        data: languages.reduce((acc, lang) => {
          acc[lang] = {
            gen_ai: {},
            benefits_s1: {},
            media: {
              video: videoUrls[lang],
              image: defaultImageUrl
            },
            meta_data: {}
          };
          return acc;
        }, {})
      };

      await collection.updateOne(
        { _id: result.upsertedId },
        { $set: newDocument }
      );
      console.log(`Inserted new document for slug: ${slug}`);
    }

  } catch (error) {
    console.error("Error updating MongoDB:", error.message);
  } finally {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
      console.log("MongoDB connection closed");
    }
  }
}

// Run the script
manuallyUpdateMongoDB().catch(console.error);
