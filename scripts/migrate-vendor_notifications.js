/**
 * Vendor Notifications Migration Script (NO DEDUPE)
 * -------------------------------------------------
 * Each old notification → NEW DOCUMENT ALWAYS.
 *
 * Prefix upgrades:
 *   ord → ODR
 *   book → EVTY
 *   ven → VEN
 *   cus → CUST
 *   quo → QUO
 *   dj  → DJS
 *   djs → DJS
 *   cat → CAT
 *   dec → DECO
 *   pav → PAV
 *   mak → MKA
 *   veu → VNP
 */

import { MongoClient } from "mongodb";

// ----------------------------
// CONFIG
// ----------------------------
const MONGO_URI_SOURCE =
    process.env.MONGO_URI_SOURCE ||
    "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev";

const MONGO_URI_DEST =
    process.env.MONGO_URI_DEST ||
    "mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod";

const SOURCE_DB_NAME = "dev";
const DEST_DB_NAME = "prod";

const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null;
const DRY_RUN = process.env.DRY_RUN === "true";

// ----------------------------
// PREFIX FIXING
// ----------------------------
function fixPrefix(id) {
    if (!id) return "";

    return id
        .replace(/^book/i, "EVTY")
        .replace(/^ord/i, "ODR")
        .replace(/^ven/i, "VEN")
        .replace(/^cus/i, "CUST")
        .replace(/^quo/i, "QUO")
        .replace(/^djs/i, "DJS")
        .replace(/^dj/i, "DJS")
        .replace(/^cat/i, "CAT")
        .replace(/^dec/i, "DECO")
        .replace(/^pav/i, "PAV")
        .replace(/^mak/i, "MKA")
        .replace(/^veu/i, "VNP");
}

// ----------------------------
// TYPE MAPPING
// ----------------------------
function detectType(oldType, doc) {
    if (!oldType) {
        if (doc?.message?.toLowerCase().includes("checkout")) return "checkout_message";
        return "chat_message";
    }

    const t = oldType.toLowerCase();

    const checkoutKeys = ["quotation", "order", "payment", "approved", "done", "pending", "confirm"];

    if (checkoutKeys.some((x) => t.includes(x))) return "checkout_message";

    return "chat_message";
}

// ----------------------------
// TRANSFORM OLD → NEW DOC
// ----------------------------
function transform(old) {
    const rawOrderId =
        old.orderId || old.order_id || old.internalOrderId || old.bookingid || "";

    return {
        service_id: fixPrefix(old.serviceId || old.service_id || ""),
        event_id: "", // old does not have event IDs
        order_id: fixPrefix(rawOrderId),
        chat_id: "", // no chat system in old DB
        vendor_id: fixPrefix(old.vendorId || old.vendor_id || ""),
        read: Boolean(old.read),
        notification_type: detectType(old.type, old),
        message: old.message || "No message",
        updated_at: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

// ----------------------------
// DETECT OLD COLLECTION
// ----------------------------
async function detectSourceCollection(db) {
    const candidates = [
        "vendornotifications",
        "vendorNotifications",
        "vendor_notifs",
        "vendor_notifications",
        "vendor-notifications",
    ];

    for (const c of candidates) {
        try {
            const exists = await db.collection(c).countDocuments({}, { limit: 1 });
            if (exists > 0) return c;
        } catch (_) { }
    }

    const all = await db.listCollections().toArray();
    const found = all.find((x) => x.name.toLowerCase().includes("vendor") && x.name.includes("notif"));
    return found?.name || null;
}

// ----------------------------
// MAIN MIGRATION
// ----------------------------
async function migrateVendorNotifications() {
    let srcClient, destClient;

    try {
        console.log("Connecting to SOURCE...");
        srcClient = new MongoClient(MONGO_URI_SOURCE);
        await srcClient.connect();
        console.log("✓ Connected to SOURCE");

        console.log("Connecting to DEST...");
        destClient = new MongoClient(MONGO_URI_DEST);
        await destClient.connect();
        console.log("✓ Connected to DEST");

        const srcDb = srcClient.db(SOURCE_DB_NAME);
        const destDb = destClient.db(DEST_DB_NAME);

        const sourceCollectionName = await detectSourceCollection(srcDb);
        if (!sourceCollectionName) {
            console.error("✗ Could not find old vendor notifications collection.");
            return;
        }

        console.log(`Detected source: ${sourceCollectionName}`);

        const srcColl = srcDb.collection(sourceCollectionName);
        const destColl = destDb.collection("vendor_notifications");

        const total = LIMIT
            ? Math.min(LIMIT, await srcColl.countDocuments({}))
            : await srcColl.countDocuments({});

        console.log(`Found ${total} notifications.`);

        const cursor = LIMIT ? srcColl.find({}).limit(LIMIT) : srcColl.find({});

        let processed = 0;
        let success = 0;
        let failed = 0;

        while (await cursor.hasNext()) {
            const oldDoc = await cursor.next();
            processed++;

            console.log(`\n[${processed}/${total}] Migrating _id: ${oldDoc._id}`);

            try {
                const newDoc = transform(oldDoc);

                if (DRY_RUN) {
                    console.log("  [DRY RUN] Would insert:", newDoc);
                    success++;
                    continue;
                }

                await destColl.insertOne(newDoc);
                console.log("  ✓ Inserted");
                success++;
            } catch (err) {
                console.error("  ✗ Failed:", err.message);
                failed++;
            }
        }

        console.log("\n===============================");
        console.log(" VENDOR NOTIFICATIONS SUMMARY  ");
        console.log("===============================");
        console.log("Processed:", processed);
        console.log("Inserted:", success);
        console.log("Failed:   ", failed);

    } catch (err) {
        console.error("Migration crashed:", err);
    } finally {
        try {
            await srcClient?.close();
            await destClient?.close();
        } catch (_) { }
    }
}

migrateVendorNotifications();
