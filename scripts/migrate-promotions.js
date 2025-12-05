/**
 * Migration Script: Promotions Collection
 *
 * Reads promotions from OLD DB (dev.promotions)
 * Writes into NEW DB (prod.promotions)
 *
 * promo_id auto-generates as PROMOxxxxxx
 * promo_sent_by = "SYS_MIGRATION"
 * Phone numbers: strip +91 → last 10 digits → validate
 */

import { MongoClient } from "mongodb";
import mongoose from "mongoose";

// 🔺 FIX THIS TO THE CORRECT PATH IN YOUR PROJECT
import Promotions from "../models2/promotions.js";

// CONNECTIONS
const MONGO_URI_SOURCE =
  process.env.MONGO_URI_SOURCE ||
  "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev?retryWrites=true&w=majority&appName=eventory-prod";

const MONGO_URI_DEST =
  process.env.MONGO_URI_DEST ||
  "mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod?retryWrites=true&w=majority";

const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : null;
const DRY_RUN = process.env.DRY_RUN === "true";

function toIST(d) {
  if (!d) return null;
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(new Date(d).getTime() + offset);
}

async function migratePromotions() {
  let sourceClient;

  try {
    console.log("🔌 Connecting to SOURCE MongoDB (old promotions)...");
    sourceClient = new MongoClient(MONGO_URI_SOURCE);
    await sourceClient.connect();
    console.log("✓ Connected to SOURCE");

    console.log("🔌 Connecting to DESTINATION MongoDB (Promotions model)...");
    await mongoose.connect(MONGO_URI_DEST);
    console.log("✓ Connected to DESTINATION\n");

    if (DRY_RUN) {
      console.log("⚠ DRY RUN MODE — NO WRITES WILL OCCUR\n");
    }

    const sourceDb = sourceClient.db("dev");
    const oldPromotionsColl = sourceDb.collection("promotions");

    console.log("📥 Fetching promotions...");
    let query = oldPromotionsColl.find({});
    if (LIMIT) query = query.limit(LIMIT);

    const oldPromos = await query.toArray();
    console.log(`📊 Loaded ${oldPromos.length} promotions.\n`);

    let success = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < oldPromos.length; i++) {
      const promo = oldPromos[i];
      console.log(`\n[${i + 1}/${oldPromos.length}] Migrating phone: ${promo.phoneNumber}`);

      try {
        // Required fields check
        if (!promo.phoneNumber || !promo.vendorName || !promo.vendorType) {
          throw new Error("Missing required fields (phoneNumber/vendorName/vendorType)");
        }

        // REMOVE ALL NON-DIGITS
        let mobile = promo.phoneNumber.toString().replace(/\D/g, "");

        // STRIP COUNTRY CODE → keep last 10 digits
        if (mobile.length > 10) {
          mobile = mobile.slice(-10);
        }

        // Validate against Indian mobile format
        if (!/^[6-9]\d{9}$/.test(mobile)) {
          throw new Error(`Invalid mobile after stripping: ${mobile}`);
        }

        const newPromoDoc = {
          promo_sent_by: "SYS_MIGRATION",
          promo_sent_to: mobile,

          is_promotions_stopped: promo.canSend?.value === false,
          promotions_stopped_at:
            promo.canSend?.value === false ? promo.canSend?.updatedAt : null,

          call_request: promo.callRequest?.value || false,
          call_requested_at: promo.callRequest?.updatedAt || null,

          req_to_join_wa_community: promo.reqToJoinCommunity?.value || false,
          join_community_req_at: promo.reqToJoinCommunity?.updatedAt || null,

          last_sent_at: promo.lastSentDate ? toIST(promo.lastSentDate) : null,

          vendor_name: promo.vendorName,
          vendor_type: promo.vendorType // DO NOT UPPERCASE
        };

        if (DRY_RUN) {
          console.log("  DRY RUN — Would insert:", newPromoDoc);
          continue;
        }

        const saved = await Promotions.create(newPromoDoc);

        console.log(
          `  ✓ Migrated → promo_id=${saved.promo_id}, mobile=${mobile}`
        );

        success++;

      } catch (err) {
        failed++;
        errors.push({ promo: promo.phoneNumber, error: err.message });
        console.log(`  ✗ ERROR: ${err.message}`);
      }
    }

    // Summary
    console.log("\n==============================");
    console.log("PROMOTIONS MIGRATION SUMMARY");
    console.log("==============================");
    console.log(`Total promotions processed: ${oldPromos.length}`);
    console.log(`Successful: ${success}`);
    console.log(`Failed: ${failed}`);

    if (errors.length > 0) {
      console.log("\n❌ ERRORS:");
      errors.forEach((e) => {
        console.log(`  Phone: ${e.promo} → ${e.error}`);
      });
    }

    console.log("\n✓ Migration Completed");

  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    if (sourceClient) {
      await sourceClient.close();
      console.log("🔌 Disconnected from SOURCE");
    }
    await mongoose.disconnect();
    console.log("🔌 Disconnected from DESTINATION");
  }
}

migratePromotions();
