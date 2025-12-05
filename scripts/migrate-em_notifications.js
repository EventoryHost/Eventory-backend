/**
 * MIGRATION: OLD ADMIN NOTIFICATIONS → NEW EM NOTIFICATIONS
 *
 * SPECIAL RULE:
 * - If old.orderId starts with "ord" → order_id = ODRxxxx , event_id = ""
 * - If old.orderId starts with "book" → event_id = EVTYxxxx , order_id = ""
 */

import { MongoClient } from "mongodb";

/*───────────────────────────────────────────
   DB CONFIG
────────────────────────────────────────────*/
const MONGO_URI_SOURCE =
    process.env.MONGO_URI_SOURCE ||
    "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev";

const MONGO_URI_DEST =
    process.env.MONGO_URI_DEST ||
    "mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod";

const SOURCE_DB = "dev";
const DEST_DB = "prod";

const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null;
const DRY_RUN = process.env.DRY_RUN === "true";

/*───────────────────────────────────────────
   PREFIX NORMALIZER
────────────────────────────────────────────*/
function normalizeId(id) {
    if (!id || typeof id !== "string") return id;

    return id
        .replace(/^ord/i, "ODR")
        .replace(/^book/i, "EVTY")
        .replace(/^ven/i, "VEN")
        .replace(/^cus/i, "CUST")
        .replace(/^quo/i, "QUO");
}

/*───────────────────────────────────────────
   DETECT SOURCE COLLECTION
────────────────────────────────────────────*/
async function detectSourceCollection(db) {
    const candidates = [
        "adminnotifications",
        "adminNotifications",
        "admin_notifications",
        "admin-notifications",
        "admin_notification"
    ];

    for (const name of candidates) {
        try {
            const exists = await db.collection(name).countDocuments({}, { limit: 1 });
            if (exists > 0) {
                console.log(`Detected source: ${name}`);
                return name;
            }
        } catch (_) { }
    }

    const all = await db.listCollections().toArray();
    const found = all.find(
        c => c.name.toLowerCase().includes("admin") && c.name.toLowerCase().includes("notif")
    );
    return found?.name || null;
}

/*───────────────────────────────────────────
   TRANSFORM OLD DOC → NEW DOC
────────────────────────────────────────────*/
function transform(old) {
    const rawOrderId = old.orderId || "";
    const newId = normalizeId(rawOrderId);

    let order_id = "";
    let event_id = "";

    // RULE:
    // If old started with "ord" → order_id only
    // If old started with "book" → event_id only
    if (/^ord/i.test(rawOrderId)) {
        order_id = newId;      // e.g. ODR1234
        event_id = "";         // empty
    } else if (/^book/i.test(rawOrderId)) {
        event_id = newId;      // e.g. EVTY1234
        order_id = "";         // empty
    }

    const message = old.message || "No message";
    const createdAt = old.timestamp
        ? new Date(old.timestamp).toISOString()
        : new Date().toISOString();


    return {
        em_id: "",              // left empty
        order_id,
        event_id,
        chat_id: "",
        message,
        read: Boolean(old.read),
        updated_at: new Date().toISOString(),
        createdAt: createdAt,
        updatedAt: new Date().toISOString()
    };
}

/*───────────────────────────────────────────
   MAIN MIGRATION
────────────────────────────────────────────*/
async function migrate() {
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

        const sourceDb = srcClient.db(SOURCE_DB);
        const destDb = destClient.db(DEST_DB);

        const sourceCollectionName = await detectSourceCollection(sourceDb);
        if (!sourceCollectionName) {
            console.error("✗ Could not detect admin notifications collection.");
            return;
        }

        const src = sourceDb.collection(sourceCollectionName);
        const dest = destDb.collection("em_notifications");

        const total = LIMIT
            ? Math.min(LIMIT, await src.countDocuments({}))
            : await src.countDocuments({});

        console.log(`Found ${total} admin notifications to migrate`);

        const cursor = LIMIT ? src.find({}).limit(LIMIT) : src.find({});

        let processed = 0;
        let success = 0;
        let failed = 0;

        while (await cursor.hasNext()) {
            const oldDoc = await cursor.next();
            processed++;

            console.log(`\n[${processed}/${total}] Migrating _id = ${oldDoc._id}`);

            try {
                const newDoc = transform(oldDoc);

                if (DRY_RUN) {
                    console.log("  [DRY RUN] Would insert:", newDoc);
                    success++;
                    continue;
                }

                await dest.insertOne(newDoc);
                console.log("  ✓ Inserted");
                success++;

            } catch (err) {
                console.error("  ✗ Failed:", err.message);
                failed++;
            }
        }

        console.log("\n===============================");
        console.log(" EM NOTIFICATIONS MIGRATION SUMMARY ");
        console.log("===============================");
        console.log("Processed:", processed);
        console.log("Inserted :", success);
        console.log("Failed   :", failed);

    } catch (err) {
        console.error("Migration crashed:", err);
    } finally {
        await srcClient?.close();
        await destClient?.close();
    }
}

migrate();
