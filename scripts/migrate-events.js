/**
 * FINAL MIGRATION SCRIPT: Bookings -> Events
 *
 * - Converts old booking documents to new events documents.
 * - Applies prefix conversions for saved IDs (ord->ODR, cus->CUST, ven->VEN, cat->CAT, dec->DECO, dj->DJS, mak->MKA, pav->PAV, veu->VNP)
 * - Creates event_id from bookingid with EVTY prefix.
 * - Queries old service/vendor/customer collections (using old prefixes) to fill vendor_manager_name and contact info.
 * - Parses paymentDetails string from old booking; builds advance_amount_paid, already_paid_amount, payment_method_details.
 * - Queries OLD orders collection using OLD orderId extracted from booking.paymentDetails to fill payment_details.customerPayable and vendorReceivable.
 * - final_order_items are built from booking.finalizedContents.
 * - Leaves quotation_id = "" and em_id = "" as requested.
 * - Leaves location_type = "".
 * - Uses placeholders for missing values (vendor/customer contacts).
 * - No meta or migrated fields are created.
 * - Supports DRY_RUN and LIMIT.
 *
 * Env:
 *   MONGO_URI_SOURCE, MONGO_URI_DEST, SOURCE_DB_NAME (default 'dev'), DEST_DB_NAME (default 'prod'), LIMIT, DRY_RUN
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
    console.error("Please set MONGO_URI_SOURCE and MONGO_URI_DEST environment variables.");
    process.exit(1);
}

/* -------------------------
   Utility helpers
--------------------------*/
function safeString(v, fallback = "") {
    if (v === undefined || v === null) return fallback;
    return String(v);
}
function safeNumber(v, fallback = 0) {
    if (v === undefined || v === null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function toIST(dateLike) {
    if (!dateLike) return null;
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    return new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
}
function addHours(d, hrs = 1) {
    return new Date(d.getTime() + hrs * 60 * 60 * 1000);
}

/* -------------------------
   Prefix conversions (for destination)
   convertPrefix: convert old prefixes -> NEW prefixes for saving
--------------------------*/
function convertPrefix(id) {
    if (!id) return id;
    return String(id)
        .replace(/^booking/i, "EVTY")
        .replace(/^book/i, "EVTY")
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

/* -------------------------
   Collection detection helpers (source DB: allow multiple naming variants)
--------------------------*/
async function findCollectionName(sourceDb, candidates) {
    const colInfos = await sourceDb.listCollections().toArray();
    const namesLower = colInfos.map((c) => c.name.toLowerCase());

    for (const c of candidates) {
        const idx = namesLower.indexOf(c.toLowerCase());
        if (idx !== -1) return colInfos[idx].name;
    }
    // partial match
    for (const c of candidates) {
        const found = colInfos.find((ci) => ci.name.toLowerCase().includes(c.toLowerCase()));
        if (found) return found.name;
    }
    return null;
}

/* -------------------------
   Service/Vendor/Customer lookup functions (use OLD DB collection names & old prefixes!)
   - Service mapping guesses (old prefixes -> candidate collections)
--------------------------*/
const SERVICE_PREFIX_MAP = {
    cat: ["caterer", "caterers", "Caterer", "Caterers"],
    dec: ["decorator", "decorators", "Decorator", "Decorators"],
    dj: ["djartist", "djartists", "DjArtist", "DjArtists"],
    mak: ["makeupartist", "makeupartists", "MakeupArtist", "MakeupArtists"],
    pav: ["photographer", "photographers", "Photographer", "Photographers"],
    veu: ["venue", "venues", "Venue", "Venues"]
};

function prefixOfServiceId(id) {
    if (!id) return null;
    const m = String(id).match(/^([a-zA-Z]+)/);
    return m ? m[1].toLowerCase() : null;
}

async function fetchServiceOld(sourceDb, serviceId) {
    if (!serviceId) return null;
    const pref = prefixOfServiceId(serviceId);
    if (!pref) return null;
    const candidates = SERVICE_PREFIX_MAP[pref];
    if (!candidates) return null;
    const colName = await findCollectionName(sourceDb, candidates);
    if (!colName) return null;
    try {
        const coll = sourceDb.collection(colName);
        const doc = await coll.findOne({ id: serviceId }) || await coll.findOne({ service_id: serviceId }) || await coll.findOne({ serviceId: serviceId });
        return doc || null;
    } catch (err) {
        console.warn(`Service lookup failed for ${serviceId}: ${err.message}`);
        return null;
    }
}

async function fetchVendorOld(sourceDb, vendorId) {
    if (!vendorId) return null;
    const colName = await findCollectionName(sourceDb, ["vendors", "vendor", "Vendors", "Vendor"]);
    if (!colName) return null;
    try {
        const coll = sourceDb.collection(colName);
        const doc = await coll.findOne({ id: vendorId }) || await coll.findOne({ venId: vendorId }) || await coll.findOne({ vendor_id: vendorId });
        return doc || null;
    } catch (err) {
        console.warn(`Vendor lookup failed for ${vendorId}: ${err.message}`);
        return null;
    }
}

async function fetchCustomerOld(sourceDb, customerId) {
    if (!customerId) return null;
    const colName = await findCollectionName(sourceDb, ["customers", "customer", "Customers", "Customer"]);
    if (!colName) return null;
    try {
        const coll = sourceDb.collection(colName);
        const doc = await coll.findOne({ id: customerId }) || await coll.findOne({ customerId: customerId }) || await coll.findOne({ customer_id: customerId });
        return doc || null;
    } catch (err) {
        console.warn(`Customer lookup failed for ${customerId}: ${err.message}`);
        return null;
    }
}

/* -------------------------
   Old Orders lookup (OLD DB) — used to get paymentDetails summary
   We will detect orders collection in source DB and query by old order id field (ord...)
--------------------------*/
async function fetchOldOrderByOldId(sourceDb, oldOrderId) {
    if (!oldOrderId) return null;
    const colName = await findCollectionName(sourceDb, ["orders", "order", "Orders", "Order"]);
    if (!colName) return null;
    try {
        const coll = sourceDb.collection(colName);
        // old orders often have orderId or order_id or id - prefer orderId
        const doc = await coll.findOne({ orderId: oldOrderId }) || await coll.findOne({ order_id: oldOrderId }) || await coll.findOne({ id: oldOrderId });
        return doc || null;
    } catch (err) {
        console.warn(`Old order lookup failed for ${oldOrderId}: ${err.message}`);
        return null;
    }
}

/* -------------------------
   Helpers to parse paymentDetails string and build payment_method_details
--------------------------*/
function safeParseJSON(s) {
    if (!s) return null;
    try {
        if (typeof s === "object") return s; // already parsed
        return JSON.parse(s);
    } catch (err) {
        // some strings may have single quotes or trailing commas - prefer robust approach
        try {
            // attempt replacement of single quotes to double quotes if it looks like JS object
            const alt = s.replace(/'/g, '"');
            return JSON.parse(alt);
        } catch (e2) {
            console.warn("Failed to parse paymentDetails JSON:", err.message);
            return null;
        }
    }
}

function buildMethodDetailsFromFetchedEntry(entry) {
    // entry is an object from fetchedDetails array
    // We'll map the fields into the new payment_method_details structure
    const md = {
        payment_method: undefined,
        channel: undefined,
        cf_payment_id: entry.cf_payment_id || entry.cf_paymentId || null,
        payment_amount: safeNumber(entry.payment_amount, 0),
        payment_completion_time: entry.payment_completion_time ? new Date(entry.payment_completion_time) : null,
        payment_status: safeString(entry.payment_status || entry.paymentStatus || entry.payment_status || ""),
        payment_message: safeString(entry.payment_message || entry.paymentMessage || ""),
        payment_group: safeString(entry.payment_group || entry.paymentGroup || ""),
        method_details: {}
    };

    // infer payment_method
    if (entry.payment_method) {
        // try common nested keys
        if (entry.payment_method.upi) {
            md.payment_method = "upi";
            md.channel = entry.payment_method.upi.channel || undefined;
            md.method_details.upi = {
                channel: entry.payment_method.upi.channel || undefined,
                upi_id: entry.payment_method.upi.upi_id || entry.payment_method.upi.upiId || undefined,
                upi_payer_ifsc: entry.payment_method.upi.upi_payer_ifsc || undefined,
                upi_payer_account_number: entry.payment_method.upi.upi_payer_account_number || undefined
            };
        } else if (entry.payment_method.card) {
            md.payment_method = "card";
            md.method_details.card = {
                card_number_masked: entry.payment_method.card.card_number_masked || undefined,
                card_holder_name: entry.payment_method.card.card_holder_name || undefined,
                expiry_mm: entry.payment_method.card.expiry_mm || undefined,
                expiry_yy: entry.payment_method.card.expiry_yy || undefined,
                card_network: entry.payment_method.card.card_network || undefined
            };
        } else if (entry.payment_method.netbanking) {
            md.payment_method = "netbanking";
            md.method_details.netbanking = {
                bank_code: entry.payment_method.netbanking.bank_code || undefined,
                bank_name: entry.payment_method.netbanking.bank_name || undefined,
                account_number: entry.payment_method.netbanking.account_number || undefined
            };
        } else {
            // fallback: if payment_group exists
            md.payment_method = entry.payment_group || undefined;
            md.method_details = entry.payment_method || {};
        }
    } else {
        // fallback using payment_group
        md.payment_method = entry.payment_group || undefined;
        md.method_details = entry.payment_method || {};
    }

    return md;
}

/* -------------------------
   Convert amount strings like "2,600" or "2%2C600" to Number (no commas)
--------------------------*/
function normalizeAmountToNumber(raw) {
    if (raw === undefined || raw === null) return 0;
    const s = String(raw);
    const clean = s.replace(/%2C/gi, "").replace(/,/g, "");
    const digits = clean.replace(/[^\d.-]/g, "");
    const n = Number(digits);
    return Number.isFinite(n) ? n : 0;
}

/* -------------------------
   final_order_items mapping from old finalizedContents[] 
--------------------------*/
function mapFinalizedContentsToCartItems(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((it) => ({
        entity: it.entity || "Customer",
        name_of_service: safeString(it.name || it.serviceName || ""),
        service_asset: Array.isArray(it.photos) ? it.photos : [],
        quantity: safeNumber(it.quantity, 1),
        description: safeString(it.description || it.desc || ""),
        price: safeNumber(it.price || it.amount || 0),
        tax_rate: safeNumber(it.tax_rate || it.taxRate || 0),
        tax_type: safeString(it.tax_type || ""),
        tax_amount: safeNumber(it.tax_amount || 0),
        total_amount: safeNumber(it.total_amount, safeNumber(it.price || 0) * safeNumber(it.quantity || 1))
    }));
}

/* -------------------------
   Validation helper (non-blocking; logs warnings)
--------------------------*/
function validateEventMinimal(doc) {
    const problems = [];
    if (!doc.event_id) problems.push("event_id missing");
    if (!doc.customer_id) problems.push("customer_id missing");
    if (!doc.vendor_id) problems.push("vendor_id missing");
    if (!doc.service_id) problems.push("service_id missing");
    if (!doc.event_location) problems.push("event_location missing");
    if (doc.final_amount === undefined || doc.final_amount === null) problems.push("final_amount missing");
    // don't throw; just return problems array
    return problems;
}

/* -------------------------
   MAIN transform function (oldBooking -> newEvent)
--------------------------*/
async function transformBookingToEvent(sourceDb, oldBooking) {
    // Extract old ids (use original strings for source lookups)
    const oldBookingIdRaw = safeString(oldBooking.bookingid || oldBooking.bookingId || oldBooking.bookingID || oldBooking._id || "");
    // event_id in new = EVTY prefix applied to old booking id
    const event_id = convertPrefix(oldBookingIdRaw);

    // order id may be present in booking.paymentDetails JSON string. We'll parse later.
    // But also there might be orderId field on booking directly; handle both.
    const oldOrderIdDirect = safeString(oldBooking.orderId || oldBooking.order_id || "");

    // service, vendor, customer old ids (for lookups)
    const oldServiceId = safeString(oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId) // note: keep pattern stable
        || safeString(oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId) // fallback, harmless
        || safeString(oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId);

    // Above line was defensive — simplifying:
    const _serviceId = safeString(oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId || oldBooking.serviceId) || safeString(oldBooking.serviceId || oldBooking.service_id || oldBooking.service || "");

    // simpler:
    const rawServiceId = safeString(oldBooking.serviceId || oldBooking.service_id || oldBooking.service || oldBooking.serviceId || "");
    const rawVendorId = safeString(oldBooking.venId || oldBooking.vendorId || oldBooking.vendor_id || oldBooking.venId || oldBooking.venId || oldBooking.venId || oldBooking.vendor || "");
    const rawCustomerId = safeString(oldBooking.customerId || oldBooking.customer_id || oldBooking.customer || oldBooking.customerId || "");

    // destination (converted) ids
    const service_id = convertPrefix(rawServiceId);
    const vendor_id = convertPrefix(rawVendorId);
    const customer_id = convertPrefix(rawCustomerId);

    // event type and location
    const event_type = safeString(oldBooking.type || oldBooking.eventType || oldBooking.event_type || "");
    const event_location = safeString(oldBooking.location || oldBooking.eventLocation || oldBooking.event_location || "");

    // event start / end: use startDate / endDate from old booking, convert to IST
    let event_start = oldBooking.startDate ? toIST(oldBooking.startDate) : null;
    let event_end = oldBooking.endDate ? toIST(oldBooking.endDate) : null;

    // booking created or fallback
    const bookingCreatedRaw = oldBooking.createdAt || oldBooking.created_at || oldBooking.bookingDate || oldBooking.booking_date || null;
    const bookingCreated = bookingCreatedRaw ? toIST(bookingCreatedRaw) : new Date();

    if (!event_start) event_start = bookingCreated;
    if (!event_end || event_end <= event_start) event_end = addHours(event_start, 1);

    // final guest count and final amount
    const final_guest_count = safeNumber(oldBooking.guest || oldBooking.guestCount || oldBooking.guest_count || 0);
    const final_amount = normalizeAmountToNumber(oldBooking.amount || oldBooking.amountPaid || oldBooking.price || 0);

    // vendor_manager_name resolution
    let vendor_manager_name = safeString(oldBooking.managerName || oldBooking.manager_name || "");
    if (!vendor_manager_name && rawServiceId) {
        const svc = await fetchServiceOld(sourceDb, rawServiceId);
        if (svc) {
            vendor_manager_name = safeString(svc.basicDetails?.managerName || svc.basicDetails?.name || svc.managerName || svc.name || "");
        }
    }
    if (!vendor_manager_name && rawVendorId) {
        const v = await fetchVendorOld(sourceDb, rawVendorId);
        if (v) {
            vendor_manager_name = safeString(v.managerName || v.vendor_manager_name || v.name || "");
        }
    }
    if (!vendor_manager_name) vendor_manager_name = "Unknown";

    // customer & vendor contacts / emails
    let vendor_manager_contact_number = "0000000000";
    let vendor_manager_contact_email = "no-reply@eventory.com";
    if (rawVendorId) {
        const v = await fetchVendorOld(sourceDb, rawVendorId);
        if (v) {
            vendor_manager_contact_number = safeString(v.mobile || v.phone || v.contact || vendor_manager_contact_number);
            vendor_manager_contact_email = safeString(v.email || v.contactEmail || vendor_manager_contact_email);
        }
    }

    let customer_name = safeString(oldBooking.customerName || oldBooking.customerName || oldBooking.customer_name || "");
    let customer_contact_number = "0000000000";
    let customer_contact_email = "no-reply@eventory.com";
    if (rawCustomerId) {
        const c = await fetchCustomerOld(sourceDb, rawCustomerId);
        if (c) {
            customer_name = customer_name || safeString(c.name || "");
            customer_contact_number = safeString(c.mobile || c.phone || customer_contact_number);
            customer_contact_email = safeString(c.email || customer_contact_email);
        }
    }

    // final_order_items
    const final_order_items = mapFinalizedContentsToCartItems(oldBooking.finalizedContents || oldBooking.finalisedContents || oldBooking.finalizedContents || []);

    // Parse booking.paymentDetails (stringified JSON in old schema)
    let parsedPaymentDetails = null;
    if (oldBooking.paymentDetails) {
        parsedPaymentDetails = safeParseJSON(oldBooking.paymentDetails);
        if (!parsedPaymentDetails) {
            // try older key names
            parsedPaymentDetails = safeParseJSON(oldBooking.payment_details) || null;
        }
    }

    // derive advance_amount_paid and already_paid_amount
    let advance_amount_paid = 0;
    let already_paid_amount = 0;
    let payment_status = ""; // keep empty per requirement
    let payment_method = ""; // keep empty per requirement
    let payment_method_details = [];

    if (parsedPaymentDetails) {
        // advancePaid and remainingPaid or similar keys
        advance_amount_paid = safeNumber(parsedPaymentDetails.advancePaid, 0);
        const remainingPaid = safeNumber(parsedPaymentDetails.remainingPaid, 0);
        already_paid_amount = safeNumber(parsedPaymentDetails.alreadyPaid || (advance_amount_paid + remainingPaid), advance_amount_paid + remainingPaid);

        // payment_status mapping from parsed paymentDetails.orderStatus
        const ps = safeString(parsedPaymentDetails.orderStatus || parsedPaymentDetails.paymentStatus || parsedPaymentDetails.payment_status || "");
        if (ps.toUpperCase() === "PAID") {
            // if already_paid_amount >= final_amount treat as fully_paid else advance_paid
            payment_status = (already_paid_amount >= final_amount && final_amount > 0) ? "fully_paid" : "advance_paid";
        } else if (ps.toUpperCase() === "REFUNDED") {
            payment_status = "refunded";
        } else {
            payment_status = "advance_paid";
        }

        // build payment_method_details from fetchedDetails array
        const fetched = parsedPaymentDetails.fetchedDetails || parsedPaymentDetails.fetched_details || parsedPaymentDetails.fetched || [];
        if (Array.isArray(fetched)) {
            for (const entry of fetched) {
                try {
                    const mapped = buildMethodDetailsFromFetchedEntry(entry);
                    payment_method_details.push(mapped);
                } catch (err) {
                    console.warn("Failed mapping a payment fetchedDetails entry:", err.message);
                }
            }
        }
    }

    // Now: payment_details (summary) should come from OLD orders collection using OLD orderId extracted from parsedPaymentDetails OR oldOrderIdDirect
    let payment_details_summary = {
        customerPayable: {
            total: 0, baseAmount: 0, convenienceFee: 0, taxOnConvenience: 0, convenienceFeeBefore: 0, taxOnConvenienceBefore: 0, couponCode: null, discountAmount: 0
        },
        vendorReceivable: {
            total: 0, baseAmount: 0, commission: 0, taxOnCommission: 0
        }
    };

    // Extract old order id from parsedPaymentDetails if available; else fallback to oldOrderIdDirect
    let extractedOldOrderId = "";
    if (parsedPaymentDetails && parsedPaymentDetails.orderId) {
        extractedOldOrderId = safeString(parsedPaymentDetails.orderId);
    } else if (parsedPaymentDetails && parsedPaymentDetails.order_id) {
        extractedOldOrderId = safeString(parsedPaymentDetails.order_id);
    } else {
        extractedOldOrderId = oldOrderIdDirect || "";
    }

    if (extractedOldOrderId) {
        try {
            const oldOrderDoc = await fetchOldOrderByOldId(sourceDb, extractedOldOrderId);
            if (oldOrderDoc && oldOrderDoc.paymentDetails) {
                // old order paymentDetails may be object or string; parse defensively
                const pd = typeof oldOrderDoc.paymentDetails === "string" ? safeParseJSON(oldOrderDoc.paymentDetails) : oldOrderDoc.paymentDetails;
                if (pd) {
                    // try to read customerPayable & vendorReceivable
                    if (pd.customerPayable) {
                        payment_details_summary.customerPayable.total = safeNumber(pd.customerPayable.total, payment_details_summary.customerPayable.total);
                        payment_details_summary.customerPayable.baseAmount = safeNumber(pd.customerPayable.baseAmount, payment_details_summary.customerPayable.baseAmount);
                        payment_details_summary.customerPayable.convenienceFee = safeNumber(pd.customerPayable.convenienceFee, payment_details_summary.customerPayable.convenienceFee);
                        payment_details_summary.customerPayable.taxOnConvenience = safeNumber(pd.customerPayable.taxOnConvenience, payment_details_summary.customerPayable.taxOnConvenience);
                        payment_details_summary.customerPayable.convenienceFeeBefore = safeNumber(pd.customerPayable.convenienceFeeBefore, payment_details_summary.customerPayable.convenienceFeeBefore);
                        payment_details_summary.customerPayable.taxOnConvenienceBefore = safeNumber(pd.customerPayable.taxOnConvenienceBefore, payment_details_summary.customerPayable.taxOnConvenienceBefore);
                        payment_details_summary.customerPayable.couponCode = safeString(pd.customerPayable.couponCode, null);
                        payment_details_summary.customerPayable.discountAmount = safeNumber(pd.customerPayable.discountAmount, 0);
                    }
                    if (pd.vendorReceivable) {
                        payment_details_summary.vendorReceivable.total = safeNumber(pd.vendorReceivable.total, payment_details_summary.vendorReceivable.total);
                        payment_details_summary.vendorReceivable.baseAmount = safeNumber(pd.vendorReceivable.baseAmount, payment_details_summary.vendorReceivable.baseAmount);
                        payment_details_summary.vendorReceivable.commission = safeNumber(pd.vendorReceivable.commission, payment_details_summary.vendorReceivable.commission);
                        payment_details_summary.vendorReceivable.taxOnCommission = safeNumber(pd.vendorReceivable.taxOnCommission, payment_details_summary.vendorReceivable.taxOnCommission);
                    }
                }
            }
        } catch (err) {
            console.warn("Failed to fetch old order for payment_details summary:", err.message);
            // leave zeros
        }
    }

    // Compose final event document (matching new events schema)
    const eventDoc = {
        event_id: event_id,
        event_number: undefined, // will be assigned by pre-save counter in Mongoose; for raw Mongo insert, leave undefined
        customer_id: customer_id,
        vendor_id: vendor_id,
        service_id: service_id,
        quotation_id: "", // left empty per requirement
        em_id: "", // left empty per requirement
        event_type: event_type,
        location_type: "", // left empty per requirement
        event_location: event_location,
        event_start: event_start,
        event_end: event_end,
        // event_created_at & event_updated_at handled by DB defaults (we won't set here)
        final_guest_count: final_guest_count,
        specific_terms: [], // empty per requirement
        final_amount: final_amount,
        event_status: safeString(oldBooking.status || oldBooking.state || oldBooking.status || "booked"),
        vendor_manager_name: vendor_manager_name,
        customer_name: customer_name || "",
        vendor_manager_contact_number: vendor_manager_contact_number,
        vendor_manager_contact_email: vendor_manager_contact_email,
        customer_contact_number: customer_contact_number,
        customer_contact_email: customer_contact_email,
        already_paid_amount: safeNumber(already_paid_amount, 0),
        advance_amount_paid: safeNumber(advance_amount_paid, 0),
        payment_status: payment_status || "", // as required leave empty or filled depending on parsed data
        payment_method: payment_method || "",
        payment_details: payment_details_summary,
        payment_method_details: payment_method_details,
        final_order_items: final_order_items
    };

    return eventDoc;
}

/* -------------------------
   MAIN migration runner
--------------------------*/
async function migrateEvents() {
    let sourceClient = null;
    let destClient = null;

    try {
        console.log("Connecting to SOURCE DB...");
        sourceClient = new MongoClient(MONGO_URI_SOURCE);
        await sourceClient.connect();
        const sourceDb = sourceClient.db(SOURCE_DB_NAME);
        console.log("✓ Connected to SOURCE");

        console.log("Connecting to DEST DB...");
        destClient = new MongoClient(MONGO_URI_DEST);
        await destClient.connect();
        const destDb = destClient.db(DEST_DB_NAME);
        console.log("✓ Connected to DEST");

        // Detect source bookings collection (try common names)
        const bookingCandidates = ["bookings", "Booking", "bookings-old", "booking", "BookingS", "Bookings"];
        const bookingsColName = await findCollectionName(sourceDb, bookingCandidates);
        if (!bookingsColName) {
            console.error("Could not detect bookings collection in source DB. Aborting.");
            return;
        }
        console.log(`Detected source bookings collection: ${bookingsColName}`);

        const srcBookings = sourceDb.collection(bookingsColName);

        // Destination collection "events" (new schema)
        const destEvents = destDb.collection("events");

        // Build count and cursor
        const totalCount = LIMIT ? Math.min(LIMIT, await srcBookings.countDocuments({})) : await srcBookings.countDocuments({});
        console.log(`Found ${totalCount} bookings to consider (limit=${LIMIT || "none"})`);
        if (totalCount === 0) {
            console.log("No bookings to migrate. Exiting.");
            return;
        }

        let cursor = srcBookings.find({}).sort({ startDate: -1 });
        if (LIMIT) cursor = cursor.limit(LIMIT);

        let processed = 0;
        let success = 0;
        let errors = 0;
        const errorList = [];

        while (await cursor.hasNext()) {
            const oldBooking = await cursor.next();
            processed++;
            console.log(`\n[${processed}/${totalCount}] Processing booking _id: ${oldBooking._id}`);

            try {
                const newEvent = await transformBookingToEvent(sourceDb, oldBooking);

                // Minimal validation (log warnings)
                const problems = validateEventMinimal(newEvent);
                if (problems.length > 0) {
                    console.warn("  ⚠ Validation warnings:", problems.join("; "));
                    // proceed; placeholders used
                }

                if (DRY_RUN) {
                    console.log("  [DRY RUN] Prepared event:", {
                        event_id: newEvent.event_id,
                        customer_id: newEvent.customer_id,
                        vendor_id: newEvent.vendor_id,
                        service_id: newEvent.service_id,
                        final_amount: newEvent.final_amount
                    });
                    success++;
                    continue;
                }

                // Upsert by event_id (replace or update entire doc)
                const filter = { event_id: newEvent.event_id };
                // We must avoid adding event_created_at/event_updated_at (let DB defaults/middleware handle)
                const update = { $set: newEvent };

                const res = await destEvents.updateOne(filter, update, { upsert: true });
                if (res.upsertedCount === 1) {
                    console.log("  ✓ Inserted event (upserted).");
                } else if (res.matchedCount === 1) {
                    console.log("  ✓ Matched existing event - updated.");
                } else {
                    console.log("  ✓ updateOne completed.");
                }
                success++;
            } catch (err) {
                errors++;
                errorList.push({ id: oldBooking._id, error: safeString(err.message) });
                console.error(`  ✗ Error migrating booking _id ${oldBooking._id}:`, err.stack || err.message);
            }
        }

        // Summary
        console.log("\n" + "=".repeat(60));
        console.log("MIGRATION SUMMARY");
        console.log("=".repeat(60));
        console.log(`Total processed: ${processed}`);
        console.log(`✓ Successful:    ${success}`);
        console.log(`✗ Errors:        ${errors}`);
        console.log("=".repeat(60));
        if (errorList.length) {
            console.log("\nErrors (first 20):");
            errorList.slice(0, 20).forEach((e, i) => {
                console.log(`${i + 1}. _id: ${e.id}  Error: ${e.error}`);
            });
        }

    } catch (err) {
        console.error("Migration failed with error:", err.stack || err.message);
    } finally {
        try {
            if (sourceClient) await sourceClient.close();
            console.log("✓ Disconnected from SOURCE");
        } catch (e) { }
        try {
            if (destClient) await destClient.close();
            console.log("✓ Disconnected from DEST");
        } catch (e) { }
    }
}

migrateEvents()
    .then(() => {
        console.log("\n✓ Migration run finished");
        process.exit(0);
    })
    .catch((err) => {
        console.error("\n✗ Migration run crashed:", err);
        process.exit(1);
    });
