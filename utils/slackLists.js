import axios from "axios";
import dotenv from "dotenv";
import CustomerEnquiry from "../models/customerEnquiry.js";
import mongoose from "mongoose";

dotenv.config();

const mapEventTypeToOption = (typeStr) => {
  if (!typeStr) return null;
  // Strip emojis and extra whitespace before matching
  const normalized = typeStr.replace(/[^\p{L}\p{N}\s]/gu, "").toLowerCase().trim();
  if (normalized.includes("birthday")) return "OptJUWLBAPN";
  if (normalized.includes("anniversary")) return "OptTEABQGD0";
  if (normalized.includes("wedding")) return "OptRQD1G7FN";
  if (normalized.includes("baby shower")) return "OptZ1CS10YH";
  if (normalized.includes("housewarming") || normalized.includes("griha"))
    return "OptSJWBXZ9V";
  if (normalized.includes("annaprashan") || normalized.includes("annprashan"))
    return "Opt5MLDOI8H";
  if (normalized.includes("corporate")) return "OptSYCRPMD9";
  if (normalized.includes("engagement")) return "OptG2T1T02L";
  if (normalized.includes("reception")) return "OptKP6ZUE08";
  if (normalized.includes("proposal")) return "OptWEJ8HPHZ";
  if (normalized.includes("religious") || normalized.includes("puja") || normalized.includes("pooja"))
    return "OptLN3OHB18"; // maps to general celebration/gathering
  if (
    normalized.includes("party") ||
    normalized.includes("gathering") ||
    normalized.includes("celebration") ||
    normalized.includes("kitty") ||
    normalized.includes("house party")
  )
    return "OptLN3OHB18";
  return null;
};

/**
 * Attempt to parse a date string from Interakt into YYYY-MM-DD.
 * Handles ISO format, DD/MM/YYYY, DD-MM-YYYY, and human-readable like "15 July 2026".
 */
const parseInteraktDate = (rawDate) => {
  if (!rawDate || typeof rawDate !== "string") return null;
  const cleaned = rawDate.trim();

  // Try native parse first (handles ISO 8601 and many standard formats)
  const nativeParsed = Date.parse(cleaned);
  if (!isNaN(nativeParsed)) {
    return new Date(nativeParsed).toISOString().split("T")[0];
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const attempt = Date.parse(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    if (!isNaN(attempt)) return new Date(attempt).toISOString().split("T")[0];
  }

  return null; // unparseable — field will be skipped
};

const mapServicesToOptions = (services) => {
  if (!Array.isArray(services)) return [];
  const mapped = [];
  services.forEach((s) => {
    const ls = s.toLowerCase();
    if (ls.includes("catering")) mapped.push("OptU6YOOSGS");
    if (ls.includes("decor")) mapped.push("OptMGHDLNYJ");
    if (ls.includes("venue")) mapped.push("Opt3NSF2V5C");
    if (
      ls.includes("music") ||
      ls.includes("entertainment") ||
      ls.includes("dj")
    ) {
      mapped.push("OptB44UJ9ED");
      mapped.push("Opt53RBRMZD");
    }
    if (ls.includes("makeup") || ls.includes("styling"))
      mapped.push("OptY8E2AJDW");
    if (ls.includes("photo") || ls.includes("video"))
      mapped.push("Opt8EM1953R");
    if (ls.includes("coordination") || ls.includes("planner"))
      mapped.push("OptX6ERL95V");
  });
  return [...new Set(mapped)];
};

/**
 * Helper to update cells of an existing Slack List item.
 */
const updateSlackListItem = async (token, listId, rowId, updates) => {
  try {
    const cells = updates.map((u) => ({
      row_id: rowId,
      ...u,
    }));

    const response = await axios.post(
      "https://slack.com/api/slackLists.items.update",
      {
        list_id: listId,
        cells,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.data || !response.data.ok) {
      console.error(
        "[SLACK_INTEGRATION] Failed to update Slack List item. Response:",
        response.data,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      "[SLACK_INTEGRATION] Network error updating Slack List item:",
      err.response?.data || err.message,
    );
    return false;
  }
};

/**
 * Triggers the Slack List item creation, updates, and webhook notification flow based on milestones.
 * @param {Object} enquiry - The CustomerEnquiry document or object.
 * @param {string} action - "create" | "update_requirements" | "complete"
 */
export const triggerSlackListAndWebhookNotification = async (
  enquiry,
  action = "complete",
) => {
  try {
    const token = process.env.SLACK_LISTS_BEARER_TOKEN;
    const webhookUrl = process.env.SLACK_TRIGGER_WEBHOOK_URL;

    if (!token || !webhookUrl) {
      console.warn(
        "[SLACK_INTEGRATION] Missing SLACK_LISTS_BEARER_TOKEN or SLACK_TRIGGER_WEBHOOK_URL in environment. Skipping.",
      );
      return;
    }

    const isLocal = process.env.IS_LOCAL === "true";
    const isDev = process.env.IS_DEV === "true";
    const forceLive = process.env.FORCE_SLACK_NOTIFICATIONS === "true";

    // Extract and map chatbot answers
    const customer_name = enquiry.customer_name || "Anonymous";
    const phone_number = enquiry.phone_number || "N/A";
    const answer_2 = enquiry.event_type || "N/A";
    const answer_3 = enquiry.event_date
      ? new Date(enquiry.event_date).toISOString().split("T")[0]
      : "Not decided";
    const answer_4 = enquiry.city || "N/A";
    const answer_5 = enquiry.venue_setting || "N/A";
    const answer_6 = Array.isArray(enquiry.services_needed)
      ? enquiry.services_needed.join(", ")
      : "N/A";
    const answer_7 = enquiry.other_service_details || "None";
    const answer_8 = enquiry.guest_count || "Not specified";
    const answer_9 = enquiry.budget_range || "Not specified";
    const answer_10 = enquiry.best_time_to_call || "Anytime";

    // Formatted description for Requirements notes column
    const reqParts = [
      `• Lead Source: Web Chatbot`,
      `• Event Type: ${answer_2}`,
      `• Event Date: ${answer_3}`,
      `• City: ${answer_4}`,
      `• Venue Setting: ${answer_5}`,
      `• Services Needed: ${answer_6}`,
      `• Other Details: ${answer_7}`,
      `• Guest Count: ${answer_8}`,
      `• Budget Range: ${answer_9}`,
      `• Best Time to Call: ${answer_10}`,
    ];
    const formattedRequirements = reqParts.join("\n");

    if ((isLocal || isDev) && !forceLive) {
      console.log(
        "--------------------------------------------------------------------------------",
      );
      console.log(
        `[SLACK_INTEGRATION] [MOCK RUN] Action: ${action.toUpperCase()}`,
      );
      console.log(`[SLACK_INTEGRATION] Enquiry ID: ${enquiry.enquiry_id}`);
      console.log(
        `[SLACK_INTEGRATION] Saved slack_ticket_id: ${enquiry.slack_ticket_id}`,
      );
      console.log(
        `[SLACK_INTEGRATION] Customer Name: ${customer_name}, Phone: ${phone_number}`,
      );
      console.log(
        "--------------------------------------------------------------------------------",
      );
      return;
    }

    // =====================================================================
    // MILESTONE 1: Create initial ticket when event type is selected
    // =====================================================================
    if (action === "create") {
      const initialFields = [
        {
          column_id: "Col09RF5UT17H",
          rich_text: [
            {
              type: "rich_text",
              elements: [
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: customer_name,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          column_id: "Col09RT68ATPX",
          select: [
            "OptU8ED23MH", // Status: Interested
          ],
        },
        {
          column_id: "Col09RWKYMG74",
          user: [
            "U0B7QRK29HA", // Sales-exec: Shubhi
          ],
        },
        {
          column_id: "Col09RWLBV0TC",
          rich_text: [
            {
              type: "rich_text",
              elements: [
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: "Web Chatbot",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const eventTypeOption = mapEventTypeToOption(enquiry.event_type);
      if (eventTypeOption) {
        initialFields.push({
          column_id: "Col09S07MSP6Y",
          select: [eventTypeOption],
        });
      }

      console.log(`[SLACK_INTEGRATION] Creating initial Slack List ticket...`);
      const listResponse = await axios.post(
        "https://slack.com/api/slackLists.items.create",
        {
          list_id: "F09RT5WG6Q5",
          initial_fields: initialFields,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!listResponse.data || !listResponse.data.ok) {
        console.error(
          "[SLACK_INTEGRATION] Failed to create initial Slack List item. Response:",
          listResponse.data,
        );
        return;
      }

      const slack_item_id = listResponse.data.item?.id || "";
      console.log(
        `[SLACK_INTEGRATION] Initial Slack List ticket created with ID: ${slack_item_id}`,
      );

      // Persist the ticket ID directly back to MongoDB if connected
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        await CustomerEnquiry.updateOne(
          { enquiry_id: enquiry.enquiry_id },
          { $set: { slack_ticket_id: slack_item_id } },
        );
      }

      // Keep in-memory object synced
      enquiry.slack_ticket_id = slack_item_id;
      return;
    }

    // For update and complete actions, we must have a saved slack_ticket_id
    if (!enquiry.slack_ticket_id) {
      console.warn(
        `[SLACK_INTEGRATION] Cannot perform ${action} without a valid slack_ticket_id. Skipping.`,
      );
      return;
    }

    // =====================================================================
    // MILESTONE 2: Update requirements gathered before collecting name/phone
    // =====================================================================
    if (action === "update_requirements") {
      const updates = [
        {
          column_id: "Col09S07W0UUC", // Address/City
          rich_text: [
            {
              type: "rich_text",
              elements: [
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: answer_4,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          column_id: "Col0AER5B6P5J", // Requirements Notes
          rich_text: [
            {
              type: "rich_text",
              elements: [
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: formattedRequirements,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      // Map Event Date date field
      if (enquiry.event_date && answer_3 !== "Not decided") {
        updates.push({
          column_id: "Col0AD8JDTHTJ",
          date: [answer_3],
        });
      }

      // Map Vendor Services multi-select dropdown
      const servicesOptions = mapServicesToOptions(enquiry.services_needed);
      if (servicesOptions.length > 0) {
        updates.push({
          column_id: "Col0AMM0VJXR8",
          select: servicesOptions,
        });
      }

      console.log(
        `[SLACK_INTEGRATION] Updating requirements on Slack List ticket ${enquiry.slack_ticket_id}...`,
      );
      await updateSlackListItem(
        token,
        "F09RT5WG6Q5",
        enquiry.slack_ticket_id,
        updates,
      );
      return;
    }

    // =====================================================================
    // MILESTONE 3: Final complete action (Update Name, Contact, & Send Webhook)
    // =====================================================================
    if (action === "complete") {
      const updates = [
        {
          column_id: "Col09RF5UT17H", // Update Name (could have changed from Anonymous)
          rich_text: [
            {
              type: "rich_text",
              elements: [
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: customer_name,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          column_id: "Col09RT7905KP", // Phone Number
          phone: [phone_number],
        },
        {
          column_id: "Col0AER5B6P5J", // Requirements Notes (Final updated block)
          rich_text: [
            {
              type: "rich_text",
              elements: [
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: formattedRequirements,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      console.log(
        `[SLACK_INTEGRATION] Performing final complete update on Slack List ticket ${enquiry.slack_ticket_id}...`,
      );
      await updateSlackListItem(
        token,
        "F09RT5WG6Q5",
        enquiry.slack_ticket_id,
        updates,
      );

      // Trigger channel notification webhook
      const webhookPayload = {
        customer_name: customer_name,
        phone_number: phone_number,
        ticket_id: enquiry.slack_ticket_id,
        trigger_message: `New Web Chatbot Lead: ${customer_name}`,
        event_type: answer_2,
        event_details: `${answer_3} ${answer_4}`,
        event_venue: answer_5,
        requirements: `${answer_6} ${answer_7} ${answer_8} ${answer_9} ${answer_10}`,
      };

      console.log(
        "[SLACK_INTEGRATION] Triggering channel notification webhook...",
      );
      const webhookResponse = await axios.post(webhookUrl, webhookPayload);
      console.log(
        `[SLACK_INTEGRATION] Webhook triggered successfully. Status: ${webhookResponse.status}`,
      );
      return;
    }
  } catch (error) {
    console.error(
      "[SLACK_INTEGRATION] Error in Slack integration flow:",
      error.response?.data || error.message,
    );
  }
};

/**
 * Processes the complete lead data from Interakt, maps the strings to Slack Option IDs,
 * creates a Slack List ticket, and fires the channel webhook notification.
 *
 * KEY BEHAVIORS:
 * - Deduplication: If the same phone number sent a lead within the last 5 minutes,
 *   we return 200 immediately without creating a new ticket. This prevents Interakt
 *   retry storms from flooding Slack.
 * - Graceful webhook: Webhook failure does NOT bubble up as 500 — ticket creation
 *   is the source of truth.
 *
 * @param {Object} data - Plain text lead details from Interakt
 */
export const triggerInteraktSlackIntegration = async (data) => {
  const LOG = "[INTERAKT_SLACK]";

  console.log(`${LOG} ============================================================`);
  console.log(`${LOG} Request received at ${new Date().toISOString()}`);

  try {
    const token = process.env.SLACK_LISTS_BEARER_TOKEN;
    const webhookUrl = process.env.SLACK_TRIGGER_WEBHOOK_URL;

    if (!token || !webhookUrl) {
      console.error(`${LOG} [ABORT] Missing SLACK_LISTS_BEARER_TOKEN or SLACK_TRIGGER_WEBHOOK_URL.`);
      return { success: false, error: "Missing Slack environment variables." };
    }

    const isLocal = process.env.IS_LOCAL === "true";
    const isDev = process.env.IS_DEV === "true";
    const forceLive = process.env.FORCE_SLACK_NOTIFICATIONS === "true";

    const payload = data || {};

    // Extract core fields
    const customerName = payload.customer_name ?? "Unknown";
    const phoneNumber = String(payload.phone_number ?? "").trim();
    const eventType = payload.event_type ?? "";
    const city = payload.city ?? "";

    console.log(`${LOG} Customer: "${customerName}" | Phone: ${phoneNumber} | Event: ${eventType} | City: ${city}`);
    console.log(`${LOG} isLocal=${isLocal} | isDev=${isDev} | forceLive=${forceLive}`);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: DEDUPLICATION GUARD
    // Check DB for any FLOW_COMPLETE enquiry from this phone in last 5 mins.
    // Return 200 immediately if duplicate found — prevents Interakt retries.
    // ─────────────────────────────────────────────────────────────────────
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
      const cutoff = new Date(Date.now() - DEDUP_WINDOW_MS);

      const existingEnquiry = await CustomerEnquiry.findOne({
        phone_number: phoneNumber,
        source: "interakt",
        status: "FLOW_COMPLETE",
        created_at: { $gte: cutoff },
      }).sort({ created_at: -1 });

      if (existingEnquiry) {
        console.warn(
          `${LOG} [DUPLICATE DETECTED] Lead for phone ${phoneNumber} was already processed at ` +
          `${existingEnquiry.created_at?.toISOString()} (enquiry_id: ${existingEnquiry.enquiry_id}). ` +
          `Returning 200 to prevent Interakt retry loop.`
        );
        console.log(`${LOG} ============================================================`);
        return { success: true, duplicate: true, existing_enquiry_id: existingEnquiry.enquiry_id };
      }

      console.log(`${LOG} [DEDUP] No duplicate found for phone ${phoneNumber} in last 5 mins. Proceeding.`);
    } else {
      console.warn(`${LOG} [DEDUP] MongoDB not connected (readyState=${mongoose.connection?.readyState}). Skipping dedup check.`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: MOCK MODE
    // ─────────────────────────────────────────────────────────────────────
    if ((isLocal || isDev) && !forceLive) {
      console.log(`${LOG} [MOCK] Local/dev env detected — not hitting Slack APIs.`);
      console.log(`${LOG} [MOCK] Would create ticket for: ${customerName} (${phoneNumber})`);
      console.log(`${LOG} ============================================================`);
      return { success: true, mock: true };
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: BUILD FORMATTED REQUIREMENTS
    // ─────────────────────────────────────────────────────────────────────
    const formatKey = (key) =>
      key.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

    // Build formData excluding empty values
    const formData = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null && value !== "") {
        formData[key] = value;
      }
    }

    // Bulleted requirements list — goes into the Slack ticket description field
    const reqParts = ["• Lead Source: WhatsApp (Interakt)"];
    for (const [key, value] of Object.entries(formData)) {
      reqParts.push(`• ${formatKey(key)}: ${value}`);
    }
    const formattedRequirements = reqParts.join("\n");

    console.log(`${LOG} [DATA] Payload keys: ${Object.keys(formData).join(", ")}`);
    console.log(`${LOG} [DATA] Requirements:\n${formattedRequirements}`);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: SAVE ENQUIRY TO DB (creates the record that dedup checks against)
    // ─────────────────────────────────────────────────────────────────────
    let savedEnquiry = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        savedEnquiry = await CustomerEnquiry.create({
          customer_name: customerName,
          phone_number: phoneNumber,
          event_type: eventType || undefined,
          city: city || undefined,
          source: "interakt",
          formData,
          status: "FLOW_COMPLETE",
        });
        console.log(`${LOG} [DB] Enquiry saved. enquiry_id=${savedEnquiry.enquiry_id}`);
      } catch (dbErr) {
        console.error(`${LOG} [DB] Failed to save enquiry (non-blocking):`, dbErr.message);
      }
    } else {
      console.warn(`${LOG} [DB] MongoDB not connected — skipping DB save.`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: CREATE SLACK LIST TICKET
    // ─────────────────────────────────────────────────────────────────────
    const rtBlock = (text) => ({
      type: "rich_text",
      elements: [{ type: "rich_text_section", elements: [{ type: "text", text }] }],
    });

    const initialFields = [
      { column_id: "Col09RF5UT17H", rich_text: [rtBlock(customerName)] },           // Name
      { column_id: "Col09RT7905KP", phone: [phoneNumber] },                          // Contact
      { column_id: "Col09RT68ATPX", select: ["OptU8ED23MH"] },                       // Status: Interested
      { column_id: "Col09RWKYMG74", user: ["U0B7QRK29HA"] },                         // Sales-exec: Shubhi
      { column_id: "Col09RWLBV0TC", rich_text: [rtBlock("WhatsApp (Interakt)")] },   // Lead Source
      { column_id: "Col0AER5B6P5J", rich_text: [rtBlock(formattedRequirements)] },   // Requirements Notes
    ];

    if (city) {
      initialFields.push({ column_id: "Col09S07W0UUC", rich_text: [rtBlock(city)] });
    }

    if (eventType) {
      const eventTypeOption = mapEventTypeToOption(eventType);
      if (eventTypeOption) {
        initialFields.push({ column_id: "Col09S07MSP6Y", select: [eventTypeOption] });
        console.log(`${LOG} [TICKET] Event type mapped: "${eventType}" → ${eventTypeOption}`);
      } else {
        console.warn(`${LOG} [TICKET] Event type not mapped to a Slack option: "${eventType}" — skipping dropdown`);
      }
    }

    const rawEventDate = payload.event_date;
    if (rawEventDate) {
      const parsedDateStr = parseInteraktDate(rawEventDate);
      if (parsedDateStr) {
        initialFields.push({ column_id: "Col0AD8JDTHTJ", date: [parsedDateStr] });
        console.log(`${LOG} [TICKET] Event date parsed: "${rawEventDate}" → ${parsedDateStr}`);
      } else {
        console.warn(`${LOG} [TICKET] Could not parse event_date: "${rawEventDate}" — skipping date field`);
      }
    }

    const rawServices = payload.services_needed;
    if (rawServices) {
      const servicesArray = Array.isArray(rawServices)
        ? rawServices
        : typeof rawServices === "string"
          ? rawServices.split(",").map((s) => s.trim())
          : [];
      if (servicesArray.length > 0) {
        const servicesOptions = mapServicesToOptions(servicesArray);
        if (servicesOptions.length > 0) {
          initialFields.push({ column_id: "Col0AMM0VJXR8", select: servicesOptions });
          console.log(`${LOG} [TICKET] Services mapped: ${servicesArray.join(", ")} → ${servicesOptions.join(", ")}`);
        } else {
          console.warn(`${LOG} [TICKET] Services received but none mapped to options: ${servicesArray.join(", ")}`);
        }
      }
    }

    console.log(`${LOG} [SLACK] Calling slackLists.items.create...`);

    const listResponse = await axios.post(
      "https://slack.com/api/slackLists.items.create",
      { list_id: "F09RT5WG6Q5", initial_fields: initialFields },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } },
    );

    console.log(`${LOG} [SLACK] slackLists.items.create response: ok=${listResponse.data?.ok}`);

    if (!listResponse.data || !listResponse.data.ok) {
      console.error(`${LOG} [SLACK] Ticket creation failed. Response:`, JSON.stringify(listResponse.data));
      return { success: false, error: "Failed to create Slack List ticket." };
    }

    const slack_item_id = listResponse.data.item?.id || "";
    console.log(`${LOG} [SLACK] Ticket created. slack_item_id=${slack_item_id}`);

    // Update DB record with slack_ticket_id
    if (savedEnquiry) {
      try {
        await CustomerEnquiry.updateOne(
          { enquiry_id: savedEnquiry.enquiry_id },
          { $set: { slack_ticket_id: slack_item_id } },
        );
        console.log(`${LOG} [DB] Updated enquiry ${savedEnquiry.enquiry_id} with slack_ticket_id=${slack_item_id}`);
      } catch (updateErr) {
        console.error(`${LOG} [DB] Failed to update slack_ticket_id (non-blocking):`, updateErr.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 6: FIRE CHANNEL NOTIFICATION (isolated try/catch)
    // Notification title is clean and short.
    // Full details are inside the Slack ticket (requirements field).
    // A failure here MUST NOT propagate as 500 to Interakt.
    // ─────────────────────────────────────────────────────────────────────
    const webhookPayload = {
      customer_name: customerName,
      phone_number: phoneNumber,
      ticket_id: slack_item_id,
      trigger_message: `📩 New Eventory Lead: ${customerName}`,
      text: `📩 New Eventory Lead: ${customerName}`,
      event_type: eventType,
      event_details: `${payload.event_date || ""} ${city}`.trim(),
      event_venue: payload.venue_setting || "",
      // Full requirements are inside the Slack ticket — not repeated here
    };

    console.log(`${LOG} [WEBHOOK] Firing channel notification. trigger_message="${webhookPayload.trigger_message}"`);

    try {
      const webhookResponse = await axios.post(webhookUrl, webhookPayload);
      console.log(`${LOG} [WEBHOOK] Notification sent. HTTP ${webhookResponse.status}`);
    } catch (webhookError) {
      console.error(
        `${LOG} [WEBHOOK] Notification failed (ticket still created — non-blocking). Error:`,
        webhookError.response?.data || webhookError.message,
      );
    }

    console.log(`${LOG} [DONE] ticket_id=${slack_item_id} | enquiry_id=${savedEnquiry?.enquiry_id}`);
    console.log(`${LOG} ============================================================`);

    return { success: true, ticket_id: slack_item_id };
  } catch (error) {
    console.error(`${LOG} [FATAL] Unhandled error:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};
