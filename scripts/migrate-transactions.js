/**
 * MIGRATION SCRIPT: Transactions (Old → New)
 *
 * Rules:
 *  - Prefix upgrades:
 *       ven → VEN
 *       cus → CUST
 *       quo → QUO
 *       ord → ODR
 *       trn → TRN
 *       bene → BENE
 *
 *  - service_id → ALWAYS EMPTY (as requested)
 *  - paymentDetails → copy exactly from old
 *  - No extra fields added
 *  - Full upsert based on transfer_id (unique)
 */

import { MongoClient } from "mongodb";

// --- ENV Configuration ---
const MONGO_URI_SOURCE =
    process.env.MONGO_URI_SOURCE ||
    "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev";

const MONGO_URI_DEST =
    process.env.MONGO_URI_DEST ||
    "mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod";

const SOURCE_DB = process.env.SOURCE_DB || "dev";
const DEST_DB = process.env.DEST_DB || "prod";

const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null;
const DRY_RUN = process.env.DRY_RUN === "true";

// -------------------- Prefix Converter --------------------
function upgradePrefix(id) {
    if (!id || typeof id !== "string") return id;

    return id
        .replace(/^ven/i, "VEN")
        .replace(/^cus/i, "CUST")
        .replace(/^quo/i, "QUO")
        .replace(/^ord/i, "ODR")
        .replace(/^bene/i, "BENE")
        .replace(/^trn/i, "TRN");
}

// -------------------- Detect Collection --------------------
async function detectSourceCollection(db) {
    const candidates = [
        "transactions",
        "Transactions",
        "transaction",
        "Transaction",
    ];

    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name.toLowerCase());

    for (const c of candidates) {
        const idx = names.indexOf(c.toLowerCase());
        if (idx !== -1) return collections[idx].name;
    }

    // fallback: partial match
    const match = collections.find((c) =>
        c.name.toLowerCase().includes("trans")
    );
    return match ? match.name : null;
}

// -------------------- Transform Old Transaction --------------------
function transformTransaction(old) {
    const newDoc = {
        quotation_id: upgradePrefix(old.quotationId || ""),
        internalOrderId: upgradePrefix(old.internalOrderId || ""),
        vendor_id: upgradePrefix(old.vendorId || ""),
        customer_id: upgradePrefix(old.customerId || ""),

        // You said service_id must be empty
        service_id: "",

        pgOrderId: old.pgOrderId || "",
        pgStatus: old.pgStatus || "",

        transfer_id: upgradePrefix(old.transfer_id || ""),
        cf_transfer_id: old.cf_transfer_id || "",
        status: old.status || "",
        transfer_amount: old.transfer_amount || 0,
        transfer_mode: old.transfer_mode || "",

        added_on: old.added_on ? new Date(old.added_on) : null,
        updated_on: old.updated_on ? new Date(old.updated_on) : null,

        payment_type: old.payment_type || "",
        beneficiary_id: upgradePrefix(old.beneficiary_id || ""),

        paymentDetails: {
            customerPayable: {
                total: old.paymentDetails?.customerPayable?.total || 0,
                baseAmount: old.paymentDetails?.customerPayable?.baseAmount || 0,
                convenienceFee:
                    old.paymentDetails?.customerPayable?.convenienceFee || 0,
                taxOnConvenience:
                    old.paymentDetails?.customerPayable?.taxOnConvenience || 0,
            },
            vendorReceivable: {
                total: old.paymentDetails?.vendorReceivable?.total || 0,
                baseAmount: old.paymentDetails?.vendorReceivable?.baseAmount || 0,
                commission: old.paymentDetails?.vendorReceivable?.commission || 0,
                taxOnCommission:
                    old.paymentDetails?.vendorReceivable?.taxOnCommission || 0,
            },
        },
    };

    return newDoc;
}

// -------------------- MAIN MIGRATION --------------------
async function migrateTransactions() {
    let sourceClient, destClient;

    try {
        console.log("Connecting to SOURCE...");
        sourceClient = await MongoClient.connect(MONGO_URI_SOURCE);
        console.log("✓ Connected to SOURCE");

        console.log("Connecting to DESTINATION...");
        destClient = await MongoClient.connect(MONGO_URI_DEST);
        console.log("✓ Connected to DESTINATION");

        const sourceDb = sourceClient.db(SOURCE_DB);
        const destDb = destClient.db(DEST_DB);

        // detect source collection
        const sourceCollectionName = await detectSourceCollection(sourceDb);
        if (!sourceCollectionName) {
            console.error("✗ Cannot detect source Transaction collection.");
            return;
        }
        console.log(`Detected source collection: ${sourceCollectionName}`);

        const src = sourceDb.collection(sourceCollectionName);
        const dest = destDb.collection("transactions");

        // Count
        const total =
            LIMIT !== null
                ? Math.min(LIMIT, await src.countDocuments({}))
                : await src.countDocuments({});
        console.log(`Found ${total} transaction docs (limit=${LIMIT || "none"})`);

        if (total === 0) {
            console.log("No docs to migrate.");
            return;
        }

        let cursor = src.find({}).sort({ createdAt: -1 });
        if (LIMIT) cursor = cursor.limit(LIMIT);

        let processed = 0,
            success = 0,
            failures = 0;
        const errors = [];

        while (await cursor.hasNext()) {
            const oldDoc = await cursor.next();
            processed++;

            console.log(`\n[${processed}/${total}] Migrating: ${oldDoc._id}`);

            try {
                const newDoc = transformTransaction(oldDoc);

                if (DRY_RUN) {
                    console.log("  [DRY RUN] Prepared:", newDoc);
                    success++;
                    continue;
                }

                // upsert based on transfer_id
                const filter = { transfer_id: newDoc.transfer_id };

                const update = { $set: newDoc };

                const res = await dest.updateOne(filter, update, { upsert: true });

                if (res.upsertedCount === 1) {
                    console.log("  ✓ Inserted new");
                } else if (res.modifiedCount === 1) {
                    console.log("  ✓ Updated existing");
                } else {
                    console.log("  ✓ Upsert complete");
                }

                success++;
            } catch (err) {
                failures++;
                errors.push({ id: oldDoc._id, error: err.message });
                console.error("  ✗ Error:", err.message);
            }
        }

        console.log("\n======================================");
        console.log("TRANSACTION MIGRATION SUMMARY");
        console.log("======================================");
        console.log("Processed:", processed);
        console.log("Successful:", success);
        console.log("Failed:", failures);
        if (errors.length) {
            console.log("Errors:");
            console.log(errors.slice(0, 20));
        }
    } catch (err) {
        console.error("✗ Migration Failed:", err);
    } finally {
        if (sourceClient) await sourceClient.close();
        if (destClient) await destClient.close();
        console.log("✓ Disconnected");
    }
}

migrateTransactions();
