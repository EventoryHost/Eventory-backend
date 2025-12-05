/**
 * Migration Script: Reviews Collection
 *
 * Migrates ALL reviews from old structure to new structure.
 * Reads from 'dev' DB on SOURCE cluster → writes to 'prod' DB on DESTINATION cluster.
 *
 * Usage:
 *   node scripts/migrate-reviews.js
 */

import { MongoClient } from "mongodb";

const MONGO_URI_SOURCE =
  process.env.MONGO_URI_SOURCE ||
  "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev?retryWrites=true&w=majority&appName=eventory-prod";

const MONGO_URI_DEST =
  process.env.MONGO_URI_DEST ||
  "mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod?retryWrites=true&w=majority";

const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : null;
const DRY_RUN = process.env.DRY_RUN === "true";

function toIST(date) {
  const dt = date ? new Date(date) : new Date();
  return new Date(dt.getTime() + 5.5 * 60 * 60 * 1000);
}

/**
 * Capitalize first 3 chars: pav → PAV
 */
function normalizeIdPrefix(id) {
  if (!id || typeof id !== "string") return id;
  if (id.length < 3) return id.toUpperCase();
  return id.substring(0, 3).toUpperCase() + id.substring(3);
}

/**
 * New rule:
 * rev20251125033108334 → FEED20251125033108334
 */
function convertReviewId(oldId) {
  if (!oldId || typeof oldId !== "string") return null;
  if (oldId.length <= 3) return "FEED" + oldId.toUpperCase();
  return "FEED" + oldId.substring(3);
}

function transformReview(old) {
  return {
    feedback_id: convertReviewId(old.reviewId), // NEW RULE

    service_id: normalizeIdPrefix(old.serviceId),
    customer_id: normalizeIdPrefix(old.userId),
    customer_name: old.reviewerName || null,

    service_type: normalizeIdPrefix(old.vendorType),

    rating: old.rating,
    review: old.feedback?.slice(0, 1000) || null,

    media_photo: old?.photos?.[0] || null,
    media_video: null,

    feedback_submitted_at: toIST(old.date),
  };
}

function validateReview(doc) {
  const errors = [];

  if (!doc.feedback_id) errors.push("feedback_id missing");
  if (!doc.service_id) errors.push("service_id missing");
  if (!doc.customer_id) errors.push("customer_id missing");
  if (!doc.customer_name) errors.push("customer_name missing");
  if (!doc.service_type) errors.push("service_type missing");

  if (typeof doc.rating !== "number") {
    errors.push("rating must be a number");
  } else if (doc.rating < 1 || doc.rating > 5) {
    errors.push("rating must be between 1–5");
  }

  if (!doc.feedback_submitted_at) errors.push("feedback_submitted_at missing");

  if (errors.length > 0) throw new Error(errors.join(", "));
}

async function migrateReviews() {
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

    if (DRY_RUN) console.log("⚠ DRY RUN MODE ACTIVE\n");

    const sourceDb = sourceClient.db("dev");
    const destDb = destClient.db("prod");

    const oldCollection = sourceDb.collection("reviews");
    const newCollection = destDb.collection("reviews");

    console.log("Counting source docs...");
    const total = await oldCollection.countDocuments();
    console.log(`Found ${total} reviews.\n`);

    let query = oldCollection.find({});
    if (LIMIT) query = query.limit(LIMIT);

    const oldReviews = await query.toArray();
    console.log(`Loaded ${oldReviews.length} reviews.\n`);

    let success = 0,
      failed = 0;
    const errors = [],
      migrated = [];

    for (let i = 0; i < oldReviews.length; i++) {
      const old = oldReviews[i];
      console.log(`[${i + 1}/${oldReviews.length}] reviewId: ${old.reviewId}`);

      try {
        if (!old.reviewId) {
          failed++;
          errors.push({ id: old._id, error: "Missing old reviewId" });
          console.log("⚠ Skipped (no reviewId)\n");
          continue;
        }

        const newDoc = transformReview(old);

        // Check if exists by new feedback_id
        const exists = await newCollection.findOne({
          feedback_id: newDoc.feedback_id,
        });

        if (exists) {
          console.log("⚠ Already exists — skipping\n");
          continue;
        }

        validateReview(newDoc);

        if (DRY_RUN) {
          console.log("DRY RUN — would insert:", newDoc.feedback_id);
        } else {
          await newCollection.insertOne(newDoc);
        }

        migrated.push({
          oldId: old.reviewId,
          newId: newDoc.feedback_id,
        });

        success++;
        console.log("✓ Migrated\n");
      } catch (err) {
        failed++;
        errors.push({
          id: old.reviewId || old._id,
          error: err.message,
        });
        console.log("✗ Error:", err.message, "\n");
      }
    }

    console.log("\n===============================");
    console.log("REVIEWS MIGRATION SUMMARY");
    console.log("===============================");
    console.log("Total:", oldReviews.length);
    console.log("Success:", success);
    console.log("Failed:", failed);

    if (migrated.length > 0) {
      console.log("\nMigrated:");
      migrated.forEach((m) =>
        console.log(`  ${m.oldId} → ${m.newId}`)
      );
    }

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach((e) =>
        console.log(`  ${e.id}: ${e.error}`)
      );
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

migrateReviews();
