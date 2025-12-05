/**
 * CLEAN FINAL MIGRATION SCRIPT FOR CUSTOMER NOTIFICATIONS
 * WITH:
 * - ID PREFIX NORMALIZATION (cus→CUST, ven→VEN, ord→ODR, quo→QUO)
 * - REBUILT CHECKOUT URL (new schema format)
 * - NO MIGRATED FIELDS
 * - SAFE UPSERT
 * - EXACT NEW SCHEMA COMPATIBILITY
 */

import { MongoClient } from "mongodb";

const MONGO_URI_SOURCE = process.env.MONGO_URI_SOURCE ||
    "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev";

const MONGO_URI_DEST = process.env.MONGO_URI_DEST ||
    "mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod";

const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : null;
const DRY_RUN = process.env.DRY_RUN === "true";

const SOURCE_DB_NAME = "dev";
const DEST_DB_NAME = "prod";

const POSSIBLE_SOURCE_COLLECTIONS = [
    "customernotifications",
    "customerNotifications",
    "customer_notifications"
];

const DEST_COLLECTION = "customer_notifications";

/*-------------------------------------------------------------
    1. PREFIX NORMALIZATION
-------------------------------------------------------------*/
function normalizeId(id) {
    if (!id) return id;

    return id
        .replace(/^cus/i, "CUST")
        .replace(/^ven/i, "VEN")
        .replace(/^ord/i, "ODR")
        .replace(/^quo/i, "QUO");
}

/*-------------------------------------------------------------
    2. CHECKOUT URL NORMALIZATION
-------------------------------------------------------------*/
function normalizeCheckoutURL(oldUrl, newDoc) {
    if (!oldUrl) return undefined;

    const amount = newDoc.final_amount || 0;

    return `/checkout?amount=${amount}&vendor_id=${newDoc.vendor_id}&user_id=${newDoc.customer_id}&orderId=${newDoc.order_id}`;
}

/*-------------------------------------------------------------
    3. DETECT SOURCE COLLECTION
-------------------------------------------------------------*/
async function detectSourceCollection(db) {
    for (const name of POSSIBLE_SOURCE_COLLECTIONS) {
        try {
            const count = await db.collection(name).countDocuments({}, { limit: 1 });
            if (count > 0) {
                console.log(`Detected source collection: '${name}'`);
                return name;
            }
        } catch (err) { }
    }

    return null;
}

/*-------------------------------------------------------------
    4. TYPE MAPPING
-------------------------------------------------------------*/
function mapNotificationType(type, oldDoc) {
    if (!type && oldDoc.checkoutURL) return "checkout_message";
    if (!type) return "chat_message";

    const s = String(type).toLowerCase();
    const checkoutWords = [
        "quotation",
        "order",
        "payment",
        "checkout",
        "booking",
        "payment_done",
        "order_request",
        "order_pending",
        "order_approved"
    ];

    return checkoutWords.some((w) => s.includes(w))
        ? "checkout_message"
        : "chat_message";
}

/*-------------------------------------------------------------
    5. TRANSFORM OLD DOCUMENT → NEW
-------------------------------------------------------------*/
function transformNotification(old) {
    let customerId = old.customerId || old.customer_id;
    let vendorId = old.vendorId || old.vendor_id;
    let orderId = old.orderId || old.order_id;
    let quotationId = old.quotationId || old.quotation_id;
    let chatId = old.chatId || old.chat_id;

    // APPLY PREFIX NORMALIZATION
    customerId = normalizeId(customerId);
    vendorId = normalizeId(vendorId);
    orderId = normalizeId(orderId);
    quotationId = normalizeId(quotationId);
    chatId = normalizeId(chatId);

    const message = old.message || "No message";
    const finalAmount = old.finalPrice || undefined;

    const notification_type = mapNotificationType(old.type, old);

    const createdAt = old.createdAt
        ? new Date(old.createdAt).toISOString()
        : new Date().toISOString();

    const updatedAt = old.updatedAt
        ? new Date(old.updatedAt).toISOString()
        : createdAt;

    const newDoc = {
        customer_id: customerId,
        order_id: orderId,
        quotation_id: quotationId,
        chat_id: chatId,
        event_id: undefined,

        vendor_id: vendorId, // Not stored in schema — we will use only for rebuild URL then remove

        notification_type,
        message,
        final_amount: finalAmount,
        read: !!old.read,

        updated_at: updatedAt,
        created_at: createdAt
    };

    // Rebuild checkout URL
    newDoc.checkout_url = normalizeCheckoutURL(old.checkoutURL, newDoc);

    // Remove vendor_id (not part of new schema)
    delete newDoc.vendor_id;

    return newDoc;
}

/*-------------------------------------------------------------
    6. VALIDATION
-------------------------------------------------------------*/
function validateNotification(n) {
    if (!n.customer_id) throw new Error("customer_id is required");
    if (!n.notification_type) throw new Error("notification_type missing");
    if (!n.message) throw new Error("message missing");
    return true;
}

/*-------------------------------------------------------------
    MAIN MIGRATION
-------------------------------------------------------------*/
async function migrateNotifications() {
    let sourceClient, destClient;

    try {
        console.log("Connecting to SOURCE...");
        sourceClient = new MongoClient(MONGO_URI_SOURCE);
        await sourceClient.connect();
        console.log("✓ Source connected");

        console.log("Connecting to DESTINATION...");
        destClient = new MongoClient(MONGO_URI_DEST);
        await destClient.connect();
        console.log("✓ Destination connected");

        const sourceDb = sourceClient.db(SOURCE_DB_NAME);
        const destDb = destClient.db(DEST_DB_NAME);

        const sourceCollectionName = await detectSourceCollection(sourceDb);
        if (!sourceCollectionName) {
            console.error("Could not detect source collection!");
            return;
        }

        const src = sourceDb.collection(sourceCollectionName);
        const dest = destDb.collection(DEST_COLLECTION);

        const total = LIMIT
            ? Math.min(LIMIT, await src.countDocuments({}))
            : await src.countDocuments({});

        console.log(`Found ${total} notifications`);

        const cursor = src.find({}).sort({ createdAt: -1 });
        if (LIMIT) cursor.limit(LIMIT);

        let processed = 0;

        while (await cursor.hasNext()) {
            const oldDoc = await cursor.next();
            processed++;

            console.log(`\n[${processed}/${total}] Migrating _id: ${oldDoc._id}`);

            try {
                const newDoc = transformNotification(oldDoc);
                validateNotification(newDoc);

                if (DRY_RUN) {
                    console.log("  [DRY RUN] OK", newDoc);
                    continue;
                }

                const dedupeKey = {
                    customer_id: newDoc.customer_id,
                    message: newDoc.message,
                    created_at: newDoc.created_at
                };

                if (newDoc.order_id) dedupeKey.order_id = newDoc.order_id;

                await dest.updateOne(
                    dedupeKey,
                    { $set: newDoc },
                    { upsert: true }
                );

                console.log("  ✓ Inserted/Updated");

            } catch (err) {
                console.error("  ✗ Error:", err.message);
            }
        }

        console.log("\n✓ Migration completed successfully");

    } finally {
        await sourceClient?.close();
        await destClient?.close();
    }
}

migrateNotifications();
