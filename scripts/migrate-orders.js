/**
 * FINAL MIGRATION SCRIPT — ORDERS
 * ---------------------------------------------------------
 * ✔ Converts all old prefixes → new prefixes:
 *     ord→ODR, quo→QUO, cus→CUST, ven→VEN,
 *     cat→CAT, dec→DECO, dj→DJS, mak→MKA, pav→PAV, veu→VNP
 *
 * ✔ Fetches service/vendor/customer using OLD prefixes
 * ✔ Destination DB service collections use EXACT names:
 *      caterers
 *      decorators
 *      dj-artists
 *      makeup-artists
 *      photographer-videographers
 *      venue-providers
 *
 * ✔ No meta fields, no migrated_from_id
 * ✔ Missing vendor_manager_name → "Unknown"
 * ✔ Missing phone/email → "0000000000" / "no-reply@eventory.com"
 * ✔ Missing event_start → order_created_at
 * ✔ Missing event_end → +1 hour
 * ✔ DRY_RUN support
 * ---------------------------------------------------------
 */

import { MongoClient } from "mongodb";

const MONGO_URI_SOURCE = process.env.MONGO_URI_SOURCE ||
    "mongodb+srv://eventorycareers:C%40reersEventory1234@eventory-prod.wrbi9gg.mongodb.net/dev";

const MONGO_URI_DEST = process.env.MONGO_URI_DEST ||
    "mongodb+srv://eventory:eventory%40123@migrateprod.oo7xcqs.mongodb.net/prod";

const SOURCE_DB_NAME = process.env.SOURCE_DB_NAME || "dev";
const DEST_DB_NAME = process.env.DEST_DB_NAME || "prod";

const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null;
const DRY_RUN = process.env.DRY_RUN === "true";

if (!MONGO_URI_SOURCE || !MONGO_URI_DEST) {
    console.error("❌ Set MONGO_URI_SOURCE and MONGO_URI_DEST environment variables.");
    process.exit(1);
}

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function safeString(v, fb = "") {
    return v === undefined || v === null ? fb : String(v);
}
function safeNumber(v, fb = 0) {
    if (v === undefined || v === null) return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
}

function toIST(d) {
    if (!d) return null;
    const dt = d instanceof Date ? d : new Date(d);
    return new Date(dt.getTime() + 5.5 * 60 * 60 * 1000);
}

/* -------------------------
   PREFIX CONVERSION (NEW)
-------------------------- */
function convertPrefix(id) {
    if (!id) return id;
    return String(id)
        .replace(/^ord/i, "ODR")
        .replace(/^quo/i, "QUO")
        .replace(/^cus/i, "CUST")
        .replace(/^ven/i, "VEN")
        .replace(/^cat/i, "CAT")
        .replace(/^dec/i, "DECO")
        .replace(/^dj/i, "DJS")
        .replace(/^mak/i, "MKA")
        .replace(/^pav/i, "PAV")
        .replace(/^veu/i, "VNP");
}

/* ---------------------------------------------------------
   SOURCE COLLECTION DETECTION
--------------------------------------------------------- */

async function findCollection(sourceDb, names) {
    const list = (await sourceDb.listCollections().toArray()).map(c => c.name.toLowerCase());
    for (const n of names) {
        const i = list.indexOf(n.toLowerCase());
        if (i >= 0) return (await sourceDb.listCollections().toArray())[i].name;
    }
    // fallback partial
    for (const n of names) {
        const found = (await sourceDb.listCollections().toArray()).find(c =>
            c.name.toLowerCase().includes(n.toLowerCase())
        );
        if (found) return found.name;
    }
    return null;
}

/* ---------------------------------------------------------
   SOURCE LOOKUPS
--------------------------------------------------------- */

async function fetchVendor(sourceDb, vendorId) {
    if (!vendorId) return null;
    const collName = await findCollection(sourceDb, ["vendors", "vendor"]);
    if (!collName) return null;
    const coll = sourceDb.collection(collName);
    return (
        (await coll.findOne({ id: vendorId })) ||
        (await coll.findOne({ vendor_id: vendorId })) ||
        null
    );
}

async function fetchCustomer(sourceDb, customerId) {
    if (!customerId) return null;
    const collName = await findCollection(sourceDb, ["customers", "customer"]);
    if (!collName) return null;
    const coll = sourceDb.collection(collName);
    return (
        (await coll.findOne({ id: customerId })) ||
        (await coll.findOne({ customer_id: customerId })) ||
        null
    );
}

/* ---- SERVICE LOOKUP USING OLD PREFIXES, ANY COLLECTION ---- */
const SERVICE_PREFIX_MAP = {
    cat: ["caterer", "caterers"],
    dec: ["decorator", "decorators"],
    dj: ["djartist", "djartists"],
    mak: ["makeupartist", "makeupartists"],
    pav: ["photographer", "photographers"],
    veu: ["venue", "venues"]
};

async function fetchService(sourceDb, serviceId) {
    if (!serviceId) return null;
    const match = serviceId.match(/^([a-zA-Z]+)/);
    if (!match) return null;
    const pref = match[1].toLowerCase();
    const candidates = SERVICE_PREFIX_MAP[pref];
    if (!candidates) return null;

    const colName = await findCollection(sourceDb, candidates);
    if (!colName) return null;

    const coll = sourceDb.collection(colName);
    return (
        (await coll.findOne({ id: serviceId })) ||
        (await coll.findOne({ service_id: serviceId })) ||
        null
    );
}

/* ---------------------------------------------------------
   TRANSFORM ORDER
--------------------------------------------------------- */

async function transformOrder(sourceDb, old) {
    /* --------------------
       BASIC IDS
    -------------------- */
    const _orderId = safeString(old.orderId || old.order_id || "");
    const _vendorId = safeString(old.vendorId || old.vendor_id || "");
    const _customerId = safeString(old.customerId || old.customer_id || "");
    const _quotationId = safeString(old.quotationId || old.quotation_id || "");
    const _serviceId = safeString(old.service_id || old.serviceId || "");

    const order_id = convertPrefix(_orderId);
    const vendor_id = convertPrefix(_vendorId);
    const customer_id = convertPrefix(_customerId);
    const quotation_id = convertPrefix(_quotationId);
    const service_id = convertPrefix(_serviceId);

    /* --------------------
       NAMES
    -------------------- */
    let customer_name =
        old.customerName ||
        old.customer_name ||
        (old.customer?.name) ||
        "";
    let vendor_manager_name = old.vendorName || "";

    /* ---- SERVICE NAME LOOKUP ---- */
    if (!vendor_manager_name && service_id) {
        const svc = await fetchService(sourceDb, _serviceId);
        if (svc?.basicDetails) {
            vendor_manager_name =
                svc.basicDetails.managerName ||
                svc.basicDetails.name ||
                "";
        }
    }
    if (!vendor_manager_name) vendor_manager_name = "Unknown";

    /* ---- VENDOR CONTACT ---- */
    let vendor_contact = "0000000000";
    let vendor_email = "no-reply@eventory.com";

    if (vendor_id) {
        const v = await fetchVendor(sourceDb, _vendorId);
        if (v) {
            vendor_contact = safeString(v.mobile || v.phone || "0000000000");
            vendor_email = safeString(v.email || "no-reply@eventory.com");
            if (vendor_manager_name === "Unknown" && v.name)
                vendor_manager_name = v.name;
        }
    }

    /* ---- CUSTOMER CONTACT ---- */
    let customer_contact = "0000000000";
    let customer_email = "no-reply@eventory.com";

    if (customer_id) {
        const c = await fetchCustomer(sourceDb, _customerId);
        if (c) {
            customer_name = customer_name || c.name || "";
            customer_contact = safeString(c.mobile || c.phone || "0000000000");
            customer_email = safeString(c.email || "no-reply@eventory.com");
        }
    }

    /* --------------------
       APPROVALS
    -------------------- */
    const approvals = old.approvals || {};
    const vendor_approval = approvals.vendor === true;
    const customer_approval = approvals.customer === true;

    /* --------------------
       LAST APPROVAL
    -------------------- */
    let last_approval = undefined;
    const la = old.lastAction || null;
    if (la?.value !== undefined) {
        last_approval = {
            approval_by: la.by?.toLowerCase() === "vendor" ? "Vendor" : "Customer",
            value: !!la.value
        };
    }

    /* --------------------
       DATES
    -------------------- */
    let event_start = old.start_date || old.event_start;
    let event_end = old.end_date || old.event_end;
    let order_created_at =
        old.bookingDate || old.createdAt || old.created_at || new Date();

    event_start = toIST(event_start) || toIST(order_created_at);
    event_end =
        toIST(event_end) ||
        new Date(event_start.getTime() + 60 * 60 * 1000);

    let order_updated_at =
        toIST(old.updatedAt || old.order_updated_at) || new Date();

    /* --------------------
       FINAL ORDER ITEMS
    -------------------- */
    const items = old.finalizedContents || [];
    const final_order_items = items.map(it => ({
        entity: it.entity || "Customer",
        name_of_service: it.name || "",
        service_asset: Array.isArray(it.photos) ? it.photos : [],
        quantity: safeNumber(it.quantity, 1),
        description: safeString(it.description),
        price: safeNumber(it.price, 0),
        tax_rate: safeNumber(it.tax_rate, 0),
        tax_type: safeString(it.tax_type),
        tax_amount: safeNumber(it.tax_amount, 0),
        total_amount:
            safeNumber(it.total_amount) ||
            safeNumber(it.price) * safeNumber(it.quantity, 1)
    }));

    /* --------------------
       BUILD FINAL DOC
    -------------------- */
    const newDoc = {
        order_id,
        em_id: safeString(old.adminId || ""),
        service_id,
        vendor_id,
        quotation_id,
        vendor_manager_name,
        customer_name,
        customer_id,
        event_start,
        event_end,
        event_type: safeString(old.event_type || ""),
        final_guest_count: safeNumber(old.number_of_guest),
        event_location: safeString(old.location || ""),
        final_amount: safeNumber(old.finalPrice || 0),
        final_checkout_url: safeString(old.finalURL || ""),
        advance_amount_requested: safeNumber(old.advance_payment || 0),
        vendor_approval,
        customer_approval,
        original_ask_by_customer: safeString(old.requirements || ""),
        last_approval,
        final_order_items,
        specificTerms: old.specificTerms || [],
        paymentDetails: old.paymentDetails || {},
        vendor_manager_contact_number: vendor_contact,
        vendor_manager_contact_email: vendor_email,
        customer_contact_number: customer_contact,
        customer_contact_email: customer_email,
        order_created_at: event_start,
        order_updated_at,
        order_status: safeString(old.status || "pending")
    };

    return newDoc;
}

/* ---------------------------------------------------------
   MIGRATION MAIN
--------------------------------------------------------- */

async function migrate() {
    console.log("Connecting to source...");
    const sourceClient = new MongoClient(MONGO_URI_SOURCE);
    await sourceClient.connect();
    const sourceDb = sourceClient.db(SOURCE_DB_NAME);
    console.log("✓ Connected to SOURCE");

    console.log("Connecting to destination...");
    const destClient = new MongoClient(MONGO_URI_DEST);
    await destClient.connect();
    const destDb = destClient.db(DEST_DB_NAME);
    console.log("✓ Connected to DEST");

    /* ---- Detect source orders collection ---- */
    const ordersCol = await findCollection(sourceDb, ["orders", "order"]);
    if (!ordersCol) {
        console.error("❌ No orders collection found in source.");
        process.exit(1);
    }
    const src = sourceDb.collection(ordersCol);
    const dest = destDb.collection("orders");

    const total = LIMIT
        ? Math.min(LIMIT, await src.countDocuments({}))
        : await src.countDocuments({});

    console.log(`Found ${total} orders to migrate.`);

    const cursor = LIMIT
        ? src.find({}).limit(LIMIT)
        : src.find({});

    let processed = 0,
        success = 0,
        fail = 0;

    while (await cursor.hasNext()) {
        const oldDoc = await cursor.next();
        processed++;
        console.log(`\n[${processed}/${total}] Migrating order _id: ${oldDoc._id}`);

        try {
            const newDoc = await transformOrder(sourceDb, oldDoc);

            if (DRY_RUN) {
                console.log("  [DRY RUN] Would upsert order:", newDoc.order_id);
                success++;
                continue;
            }

            const res = await dest.updateOne(
                { order_id: newDoc.order_id },
                { $set: newDoc },
                { upsert: true }
            );

            if (res.upsertedCount === 1)
                console.log("  ✓ Inserted new document");
            else
                console.log("  ✓ Updated existing");

            success++;
        } catch (err) {
            fail++;
            console.error("  ✗ Error:", err.message);
        }
    }

    console.log("\n===== SUMMARY =====");
    console.log("Processed:", processed);
    console.log("Successful:", success);
    console.log("Failed:", fail);

    await sourceClient.close();
    await destClient.close();
    console.log("✓ Disconnected from both DB");
}

migrate()
    .then(() => {
        console.log("\n✓ Migration Finished");
        process.exit(0);
    })
    .catch(err => {
        console.error("✗ Migration crashed:", err);
        process.exit(1);
    });
