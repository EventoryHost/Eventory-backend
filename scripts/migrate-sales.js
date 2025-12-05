/**
 * Migration Script: Sales → Sales Executives
 *
 * Moves old sales users into new sales_executives structure.
 *
 * Usage:
 *   node scripts/migrate-sales.js
 */

import { MongoClient } from "mongodb";

// CONNECTION STRINGS
const MONGO_URI_SOURCE =
  process.env.MONGO_URI_SOURCE ||
  "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev?retryWrites=true&w=majority&appName=eventory-prod";

const MONGO_URI_DEST =
  process.env.MONGO_URI_DEST ||
  "mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod?retryWrites=true&w=majority";

const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : null;
const DRY_RUN = process.env.DRY_RUN === "true";

/**
 * Transform old Sales → Sales Executive
 */
function transformSales(old) {
  return {
    sales_ex_id: null, // Let DB auto-generate SAEXxxxx

    user_name: old.username,
    profile_photo: null,
    password: old.password,
    contact_name: old.username, // required field
    contact_number: null, // no phone in old schema

    vendor_search_history: [],

    createdAt: old.createdAt ? new Date(old.createdAt) : new Date(),
    updatedAt: old.updatedAt ? new Date(old.updatedAt) : new Date(),
  };
}

/**
 * Validate new SalesExecutive record
 */
function validateSales(doc) {
  const errors = [];

  if (!doc.user_name) errors.push("user_name missing");
  if (!doc.password) errors.push("password missing");
  if (!doc.contact_name) errors.push("contact_name missing");

  if (doc.user_name && doc.user_name.length < 3) {
    errors.push("user_name too short (<3 chars)");
  }

  if (doc.password && doc.password.length < 6) {
    errors.push("password too short (<6 chars)");
  }

  if (errors.length > 0) throw new Error(errors.join(", "));
}

/**
 * MAIN MIGRATION FUNCTION
 */
async function migrateSales() {
  let sourceClient, destClient;

  try {
    console.log("Connecting to SOURCE...");
    sourceClient = new MongoClient(MONGO_URI_SOURCE);
    await sourceClient.connect();
    console.log("✓ Connected to SOURCE\n");

    console.log("Connecting to DESTINATION...");
    destClient = new MongoClient(MONGO_URI_DEST);
    await destClient.connect();
    console.log("✓ Connected to DESTINATION\n");

    if (DRY_RUN) console.log("⚠ DRY RUN - no writes will occur\n");

    const sourceDb = sourceClient.db("dev");
    const destDb = destClient.db("prod");

    const oldCollection = sourceDb.collection("sales");
    const newCollection = destDb.collection("sales_executives");

    console.log("Counting source sales users...");
    const total = await oldCollection.countDocuments();
    console.log(`Total old sales users: ${total}\n`);

    let query = oldCollection.find({});
    if (LIMIT) query = query.limit(LIMIT);

    const oldSales = await query.toArray();
    console.log(`Loaded ${oldSales.length} old sales users.\n`);

    let success = 0,
      failed = 0;
    const errors = [],
      migrated = [];

    for (let i = 0; i < oldSales.length; i++) {
      const old = oldSales[i];
      console.log(`[${i + 1}/${oldSales.length}] username: ${old.username}`);

      try {
        if (!old.username || !old.password) {
          failed++;
          errors.push({
            id: old._id,
            error: "Missing username or password",
          });
          console.log("⚠ Skip (missing username/password)\n");
          continue;
        }

        // Skip duplicates (unique user_name)
        const exists = await newCollection.findOne({
          user_name: old.username,
        });
        if (exists) {
          console.log("⚠ Already exists — skipping\n");
          continue;
        }

        const newDoc = transformSales(old);

        validateSales(newDoc);

        if (DRY_RUN) {
          console.log("DRY RUN — would insert:", newDoc.user_name);
        } else {
          await newCollection.insertOne(newDoc);
        }

        migrated.push({
          oldUser: old.username,
        });

        success++;
        console.log("✓ Migrated\n");
      } catch (err) {
        failed++;
        errors.push({
          id: old.username || old._id,
          error: err.message,
        });
        console.log("✗ Error:", err.message, "\n");
      }
    }

    // SUMMARY
    console.log("\n===============================");
    console.log("SALES MIGRATION SUMMARY");
    console.log("===============================");
    console.log("Total:", oldSales.length);
    console.log("Success:", success);
    console.log("Failed:", failed);

    if (migrated.length > 0) {
      console.log("\nMigrated:");
      migrated.forEach((m) => console.log(`  ${m.oldUser}`));
    }

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach((e) => console.log(`  ${e.id}: ${e.error}`));
    }

    console.log("\n✓ DONE");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (destClient) await destClient.close();
  }
}

migrateSales();
