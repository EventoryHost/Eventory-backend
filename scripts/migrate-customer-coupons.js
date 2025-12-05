/**
 * Migration Script: Customer Coupons
 *
 * Migrates ALL customer coupon data from old structure to new structure
 * Reads from 'dev' database on SOURCE cluster and writes to 'prod' database on DESTINATION cluster
 *
 * Usage:
 *   node scripts/migrate-customer-coupons.js
 *
 * Environment Variables:
 *   MONGO_URI_SOURCE - Source MongoDB connection string (where old data is)
 *   MONGO_URI_DEST   - Destination MongoDB connection string (where new data will be)
 *   LIMIT            - Number of documents to migrate (defaults to null = migrate all)
 *   DRY_RUN          - Set to 'true' for dry run mode (defaults to false)
 */

import mongoose from "mongoose";
import { MongoClient } from "mongodb";

// MongoDB connection strings
// Source database (where old data is) - using 'dev' database
const MONGO_URI_SOURCE =
  process.env.MONGO_URI_SOURCE ||
  "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev?retryWrites=true&w=majority&appName=eventory-prod";

// Destination database (where new data will be migrated to) - using 'prod' database
const MONGO_URI_DEST =
  process.env.MONGO_URI_DEST ||
  "mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod?retryWrites=true&w=majority";

// Set LIMIT to null to migrate all documents
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null; // null = migrate all
const DRY_RUN = process.env.DRY_RUN === "true";

/**
 * Convert date to IST (UTC+5:30)
 */
function toIST(date) {
  if (!date) {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
  }
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset);
}

/**
 * Transform team value to new format (uppercase enum)
 * Old: "Sales" | "Social Media" | "Event"
 * New: "SALES" | "SOCIAL MEDIA" | "EVENT"
 */
function transformTeam(oldTeam) {
  if (!oldTeam) return "SALES"; // default + log in caller

  const normalized = String(oldTeam).trim().toLowerCase();

  switch (normalized) {
    case "sales":
      return "SALES";
    case "social media":
      return "SOCIAL MEDIA";
    case "event":
      return "EVENT";
    default:
      // fallback, will log in caller
      return "SALES";
  }
}

/**
 * Transform old CustomerCoupon document to new structure
 * Source schema:
 *  code, team, discount, isActive, createdAt, updatedAt
 *
 * Destination schema:
 *  coupon_code, coupon_team, discount_percentage, is_active,
 *  coupon_created_at, coupon_updated_at
 */
function transformCustomerCoupon(oldCoupon) {
  const coupon_code = (oldCoupon.code || "").toString().trim().toUpperCase();
  const rawTeam = oldCoupon.team || null;
  const coupon_team = transformTeam(rawTeam);
  const discount_percentage = oldCoupon.discount;

  const is_active =
    typeof oldCoupon.isActive === "boolean" ? oldCoupon.isActive : true;

  const coupon_created_at = toIST(oldCoupon.createdAt);
  const coupon_updated_at = toIST(oldCoupon.updatedAt);

  const newCoupon = {
    coupon_code,
    coupon_team,
    discount_percentage,
    is_active,
    coupon_created_at,
    coupon_updated_at,
  };

  return { newCoupon, rawTeam };
}

/**
 * Validate transformed coupon document against destination rules
 */
function validateCustomerCoupon(coupon) {
  const errors = [];

  // coupon_code: required, 3–20 chars
  if (!coupon.coupon_code) {
    errors.push("coupon_code is required");
  } else {
    const len = coupon.coupon_code.length;
    if (len < 3 || len > 20) {
      errors.push(
        `coupon_code length must be between 3 and 20 characters (got ${len})`
      );
    }
  }

  // coupon_team: required, valid enum
  const allowedTeams = ["SALES", "SOCIAL MEDIA", "EVENT"];
  if (!coupon.coupon_team) {
    errors.push("coupon_team is required");
  } else if (!allowedTeams.includes(coupon.coupon_team)) {
    errors.push(
      `coupon_team must be one of ${allowedTeams.join(
        ", "
      )} (got ${coupon.coupon_team})`
    );
  }

  // discount_percentage: required, enum [25, 50, 100]
  const allowedDiscounts = [25, 50, 100];
  if (
    coupon.discount_percentage === undefined ||
    coupon.discount_percentage === null
  ) {
    errors.push("discount_percentage is required");
  } else if (!allowedDiscounts.includes(coupon.discount_percentage)) {
    errors.push(
      `discount_percentage must be one of ${allowedDiscounts.join(
        ", "
      )} (got ${coupon.discount_percentage})`
    );
  }

  // is_active: defaulted earlier, but still sanity check
  if (typeof coupon.is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }

  // dates
  if (!coupon.coupon_created_at) {
    errors.push("coupon_created_at is required");
  }
  if (!coupon.coupon_updated_at) {
    errors.push("coupon_updated_at is required");
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }

  return true;
}

/**
 * Main migration function
 */
async function migrateCustomerCoupons() {
  let sourceClient;
  let destClient;

  try{
    // Connect to source MongoDB (old data)
    console.log("Connecting to SOURCE MongoDB (old data)...");
    console.log(
      `Source URI: ${MONGO_URI_SOURCE.replace(/:[^:@]+@/, ":****@")}`
    );
    sourceClient = new MongoClient(MONGO_URI_SOURCE);
    await sourceClient.connect();
    console.log("✓ Connected to SOURCE MongoDB\n");

    // Connect to destination MongoDB (new data)
    console.log("Connecting to DESTINATION MongoDB (new data)...");
    console.log(`Dest URI: ${MONGO_URI_DEST.replace(/:[^:@]+@/, ":****@")}`);
    destClient = new MongoClient(MONGO_URI_DEST);
    await destClient.connect();
    console.log("✓ Connected to DESTINATION MongoDB\n");

    if (DRY_RUN) {
      console.log("⚠ DRY RUN MODE - No data will be modified\n");
    }

    const sourceDbName = "dev"; // where old data is
    const destDbName = "prod"; // where new data goes

    console.log(`Source database: '${sourceDbName}'`);
    console.log(`Destination database: '${destDbName}'\n`);

    const sourceDb = sourceClient.db(sourceDbName);
    const destDb = destClient.db(destDbName);

    // Source collection: based on model name "CustomerCoupon" => "customercoupons"
    const oldCollection = sourceDb.collection("customercoupons");

    // Destination collection: explicitly "customer-coupons"
    const newCollection = destDb.collection("customer-coupons");

    console.log(`Verifying source collection 'customercoupons'...`);
    const totalCount = await oldCollection.countDocuments();
    console.log(
      `✓ Found ${totalCount} customer coupons in 'dev.customercoupons'\n`
    );

    if (totalCount === 0) {
      console.log("No customer coupons to migrate. Exiting.");
      return;
    }

    // Fetch documents
    if (LIMIT) {
      console.log(`Fetching top ${LIMIT} documents from old coupons...`);
    } else {
      console.log("Fetching ALL documents from old coupons...");
    }

    let query = oldCollection.find({}).sort({ createdAt: -1 });
    if (LIMIT) {
      query = query.limit(LIMIT);
    }
    const oldCoupons = await query.toArray();

    console.log(`✓ Loaded ${oldCoupons.length} coupons to process\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const migrated = [];

    console.log("Processing customer coupons...\n");

    for (let i = 0; i < oldCoupons.length; i++) {
      const oldCoupon = oldCoupons[i];
      const idx = i + 1;

      try {
        console.log(
          `[${idx}/${oldCoupons.length}] Processing coupon: ${
            oldCoupon.code || oldCoupon._id
          }`
        );
        console.log(`  Team: ${oldCoupon.team || "N/A"}`);
        console.log(`  Discount: ${oldCoupon.discount || "N/A"}%`);

        // Skip malformed docs (missing essential fields)
        if (!oldCoupon.code || !oldCoupon.team || !oldCoupon.discount) {
          console.log(
            "  ⚠ Skipping malformed document - missing code, team, or discount"
          );
          errorCount++;
          errors.push({
            oldId: oldCoupon._id,
            code: oldCoupon.code || "N/A",
            error: "Malformed document - missing essential fields",
          });
          console.log("");
          continue;
        }

        // Transform
        const { newCoupon, rawTeam } = transformCustomerCoupon(oldCoupon);

        // Log if team was auto-normalized from something unexpected
        const expectedTeams = ["Sales", "Social Media", "Event"];
        if (rawTeam && !expectedTeams.includes(rawTeam)) {
          console.log(
            `  ⚠ Unexpected team value '${rawTeam}' - normalized to '${newCoupon.coupon_team}'`
          );
        }

        // Check if already exists in destination
        const existing = await newCollection.findOne({
          coupon_code: newCoupon.coupon_code,
        });
        if (existing) {
          console.log(
            `  ⚠ Coupon with code '${newCoupon.coupon_code}' already exists - skipping`
          );
          console.log("");
          continue;
        }

        // Validate final structure
        validateCustomerCoupon(newCoupon);

        if (DRY_RUN) {
          console.log("  [DRY RUN] Would migrate:");
          console.log(`    coupon_code:        ${newCoupon.coupon_code}`);
          console.log(`    coupon_team:        ${newCoupon.coupon_team}`);
          console.log(
            `    discount_percentage: ${newCoupon.discount_percentage}%`
          );
          console.log(`    is_active:          ${newCoupon.is_active}`);
          console.log(
            `    coupon_created_at:   ${newCoupon.coupon_created_at.toISOString()}`
          );
          console.log(
            `    coupon_updated_at:   ${newCoupon.coupon_updated_at.toISOString()}`
          );
        } else {
          // Insert into destination
          await newCollection.insertOne(newCoupon);
          console.log("  ✓ Successfully migrated");
        }

        migrated.push({
          oldId: oldCoupon._id,
          code: oldCoupon.code,
          newCode: newCoupon.coupon_code,
        });

        successCount++;
        console.log(""); // spacing
      } catch (err) {
        errorCount++;
        const errorInfo = {
          oldId: oldCoupon._id,
          code: oldCoupon.code || "N/A",
          error: err.message,
        };
        errors.push(errorInfo);
        console.error(`  ✗ Error: ${err.message}`);
        console.error(`  Stack: ${err.stack}`);
        console.log("");
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("CUSTOMER COUPONS MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total coupons processed: ${oldCoupons.length}`);
    console.log(`✓ Successful:            ${successCount}`);
    console.log(`✗ Errors:               ${errorCount}`);
    console.log(
      `Progress:                ${(
        (successCount / oldCoupons.length) *
        100
      ).toFixed(1)}%`
    );

    if (DRY_RUN) {
      console.log("\n⚠ This was a DRY RUN - No data was actually modified");
    }

    if (migrated.length > 0) {
      console.log("\n" + "-".repeat(60));
      console.log("MIGRATED COUPONS:");
      console.log("-".repeat(60));
      migrated.forEach((c, idx) => {
        console.log(`${idx + 1}. Code: ${c.code}`);
        console.log(`   Old _id:  ${c.oldId}`);
        console.log(`   New code: ${c.newCode}`);
      });
    }

    if (errors.length > 0) {
      console.log("\n" + "-".repeat(60));
      console.log("ERRORS:");
      console.log("-".repeat(60));
      errors.forEach((e, idx) => {
        console.log(`${idx + 1}. Code: ${e.code} (Old _id: ${e.oldId})`);
        console.log(`   Error: ${e.error}`);
      });
    }

    console.log("\n" + "=".repeat(60));
  } catch (err) {
    console.error("\n✗ Migration failed:", err);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (sourceClient) {
      await sourceClient.close();
      console.log("\n✓ Disconnected from SOURCE MongoDB");
    }
    if (destClient) {
      await destClient.close();
      console.log("✓ Disconnected from DESTINATION MongoDB");
    }
  }
}

// Run migration
migrateCustomerCoupons()
  .then(() => {
    console.log("\n✓ Customer coupons migration completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n✗ Migration failed:", err);
    process.exit(1);
  });
