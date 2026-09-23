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
 * Handles:
 *  - Relative keywords: "today", "aaj", "tomorrow", "kal", "next week"
 *  - ISO 8601 (2026-07-15)
 *  - DD/MM/YYYY and DD-MM-YYYY
 *  - "15 July 2026", "15 July", "July 15", "July 15 2026" (English & Hindi month names)
 *  - "23sept", "23september"
 *  - DD/MM and DD-MM (assumes current year)
 */
const parseInteraktDate = (rawDate) => {
  if (!rawDate || typeof rawDate !== "string") return null;
  const cleaned = rawDate.trim();
  const lower = cleaned.toLowerCase();

  // ── Relative keywords ──────────────────────────────────────────────────────
  const todayKeywords = ["today", "aaj", "aaj ka", "same day"];
  const tomorrowKeywords = ["tomorrow", "kal", "next day", "parso nahi kal"];
  const nextWeekKeywords = ["next week", "agle hafte"];

  if (todayKeywords.some((k) => lower.includes(k))) {
    return new Date().toISOString().split("T")[0];
  }
  if (tomorrowKeywords.some((k) => lower.includes(k))) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
  if (nextWeekKeywords.some((k) => lower.includes(k))) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  }

  // ── Month name lookup (English + Hindi transliterations) ───────────────────
  const monthMap = {
    jan: 1, january: 1, januar: 1,
    feb: 2, february: 2, febr: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
    // Hindi month transliterations
    januari: 1, pharvari: 2, marta: 3, aprail: 4,
    mei: 5, juni: 6, juli: 7, agast: 8,
    sitambar: 9, aktoobar: 10, navambar: 11, disambar: 12,
  };

  const currentYear = new Date().getFullYear();

  // Handle "23sept", "23Sep", "23SEPT", "23september", "23sep2026" etc.
  const gluedMatch = lower.match(/^(\d{1,2})(st|nd|rd|th)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(\d{2,4})?$/);
  if (gluedMatch) {
    const day = parseInt(gluedMatch[1], 10);
    const monthKey = gluedMatch[3];
    const monthNum = monthMap[monthKey] ?? monthMap[monthKey.slice(0, 3)] ?? null;
    if (monthNum && day >= 1 && day <= 31) {
      const yr = gluedMatch[4] ? (+gluedMatch[4] < 100 ? 2000 + +gluedMatch[4] : +gluedMatch[4]) : currentYear;
      return `${yr}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // "15 July 2026" or "15 July" or "July 15" or "July 15 2026"
  const textDateMatch = cleaned.match(
    /^(\d{1,2})\s+([a-zA-Z]+)\s*(\d{4})?$|^([a-zA-Z]+)\s+(\d{1,2})[,\s]*(\d{4})?$/
  );
  if (textDateMatch) {
    let day, monthStr, year;
    if (textDateMatch[1]) {
      // DD Month [YYYY]
      day = parseInt(textDateMatch[1], 10);
      monthStr = textDateMatch[2].toLowerCase();
      year = textDateMatch[3] ? parseInt(textDateMatch[3], 10) : currentYear;
    } else {
      // Month DD [YYYY]
      monthStr = textDateMatch[4].toLowerCase();
      day = parseInt(textDateMatch[5], 10);
      year = textDateMatch[6] ? parseInt(textDateMatch[6], 10) : currentYear;
    }
    const monthNum = monthMap[monthStr];
    if (monthNum && day >= 1 && day <= 31) {
      const iso = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const attempt = Date.parse(iso);
      if (!isNaN(attempt)) return new Date(attempt).toISOString().split("T")[0];
    }
  }

  // ── DD/MM/YYYY or DD-MM-YYYY ───────────────────────────────────────────────
  const dmyFull = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmyFull) {
    const [, d, m, y] = dmyFull;
    const attempt = Date.parse(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    if (!isNaN(attempt)) return new Date(attempt).toISOString().split("T")[0];
  }

  // ── DD/MM or DD-MM (short, assume current year) ───────────────────────────
  const dmyShort = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})$/);
  if (dmyShort) {
    const [, d, m] = dmyShort;
    const attempt = Date.parse(`${currentYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    if (!isNaN(attempt)) return new Date(attempt).toISOString().split("T")[0];
  }

  // ── No match — return null (Date.parse NOT used: it gives wrong years for inputs like "23sept") ──
  console.warn(`[INTERAKT_DATE_PARSE] Could not parse: "${cleaned}"`);
  return null;
};

/**
 * Convert YYYY-MM-DD string to DD/MM/YYYY for display in Requirements.
 */
const formatDateForDisplay = (isoDateStr) => {
  if (!isoDateStr) return null;
  const [y, m, d] = isoDateStr.split("-");
  return `${d}/${m}/${y}`;
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
    // Date displayed as dd/mm/yyyy for readability
    const displayDate = enquiry.event_date
      ? formatDateForDisplay(new Date(enquiry.event_date).toISOString().split("T")[0])
      : (enquiry.event_date_raw || "Not decided");
    const isoDate = enquiry.event_date
      ? new Date(enquiry.event_date).toISOString().split("T")[0]
      : null;

    const reqParts = [
      `• Lead Source: Web Chatbot`,
      `• Customer Name: ${customer_name}`,
      `• Event Type: ${answer_2}`,
      `• Event Date: ${displayDate}`,
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

      // Also ensure city, event date, and vendor services are populated
      // (in case update_requirements milestone never fired)
      if (answer_4 && answer_4 !== "N/A") {
        updates.push({
          column_id: "Col09S07W0UUC", // Address/City
          rich_text: [
            {
              type: "rich_text",
              elements: [
                { type: "rich_text_section", elements: [{ type: "text", text: answer_4 }] },
              ],
            },
          ],
        });
      }

      if (isoDate) {
        updates.push({
          column_id: "Col0AD8JDTHTJ", // Event Date
          date: [isoDate],
        });
      }

      const completionServicesOptions = mapServicesToOptions(enquiry.services_needed);
      if (completionServicesOptions.length > 0) {
        updates.push({
          column_id: "Col0AMM0VJXR8", // Vendor Services
          select: completionServicesOptions,
        });
      }

      console.log(
        `[SLACK_INTEGRATION] Performing final complete update on Slack List ticket ${enquiry.slack_ticket_id}...`,
      );
      await updateSlackListItem(
        token,
        "F09RT5WG6Q5",
        enquiry.slack_ticket_id,
        updates,
      );

      // Trigger channel notification webhook — isolated so failure doesn't crash ticket update
      try {
        const webhookPayload = {
          customer_name: customer_name,
          phone_number: phone_number,
          ticket_id: enquiry.slack_ticket_id,
          trigger_message: `New Web Chatbot Lead: ${customer_name}`,
          event_type: answer_2,
          event_details: `${displayDate} ${answer_4}`.trim(),
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
      } catch (webhookError) {
        console.error(
          "[SLACK_INTEGRATION] Webhook notification failed (ticket update succeeded — non-blocking):",
          webhookError.response?.data || webhookError.message,
        );
      }
      return;
    }
  } catch (error) {
    console.error(
      "[SLACK_INTEGRATION] Error in Slack integration flow:",
      error.response?.data || error.message,
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERAKT → SLACK LIST
// ─────────────────────────────────────────────────────────────────────────────

const INTERAKT_SLACK_LIST_ID = "F09RT5WG6Q5";

// Interakt hits the webhook more than once per lead (first with just name + phone,
// later with the full answers). Any hit for the same phone within this window
// updates the existing ticket instead of creating a new one.
const INTERAKT_LOOKBACK_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * True for values that should be treated as "not provided": undefined / null,
 * blank strings, and unfilled Interakt placeholders such as "{{3}}".
 */
const isEmptyInteraktValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" || /^\{\{\s*\w+\s*\}\}$/.test(trimmed);
  }
  return false;
};

/** Returns a copy of the payload with all empty values removed. */
const pickNonEmptyInteraktFields = (payload) => {
  const out = {};
  for (const [key, value] of Object.entries(payload || {})) {
    if (!isEmptyInteraktValue(value)) out[key] = value;
  }
  return out;
};

const formatInteraktKey = (key) =>
  key.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

const rtBlock = (text) => ({
  type: "rich_text",
  elements: [{ type: "rich_text_section", elements: [{ type: "text", text }] }],
});

/**
 * Builds everything derived from the (merged) Interakt lead data:
 *  - the Requirements Notes text
 *  - the Slack List *data* column cells (Name, Contact, Requirements Notes, City,
 *    Event Type, Event Date, Vendor Services) — only columns that have a value
 *  - the channel-notification webhook fields
 *
 * Shared by the create and update paths. Status / Sales-exec / Lead Source are
 * NOT included here — they are set only when a ticket is first created.
 *
 * @param {Object} formData - Non-empty lead fields (merged across Interakt hits)
 * @param {string} LOG - Log prefix
 */
const buildInteraktLeadDetails = (formData, LOG) => {
  const customerName = formData.customer_name ? String(formData.customer_name) : "";
  const phoneNumber = String(formData.phone_number ?? "").trim();
  const eventType = formData.event_type ? String(formData.event_type) : "";
  const city = formData.city ? String(formData.city) : "";

  // Extract caterer-specific fields
  const guestCount       = formData.guest_count        ?? null;
  const budget           = formData.budget             ?? null;
  const mealService      = formData.meal_service       ?? null;  // e.g. "Buffet", "Plated"
  const menuType         = formData.menu_type          ?? null;  // e.g. "Veg", "Non-Veg", "Both"
  const foodServingStyle = formData.food_serving_style ?? null;  // e.g. "Live counter"

  // Parse event_date early so we can use dd/mm/yyyy in requirements
  const rawEventDate = formData.event_date ?? null;
  const parsedDateIso = rawEventDate ? parseInteraktDate(String(rawEventDate)) : null;
  const parsedDateDisplay = parsedDateIso ? formatDateForDisplay(parsedDateIso) : (rawEventDate ? String(rawEventDate) : null);

  // ── Build requirements bullet list (safety net — captures EVERYTHING) ──
  // Always include Lead Source first, then all known fields in a readable order.
  const reqParts = ["• Lead Source: WhatsApp (Interakt)"];

  // Core fields in defined order
  if (formData.customer_name)    reqParts.push(`• Customer Name: ${formData.customer_name}`);
  if (formData.phone_number)     reqParts.push(`• Phone Number: ${formData.phone_number}`);
  if (formData.event_type)       reqParts.push(`• Event Type: ${formData.event_type}`);
  if (parsedDateDisplay)         reqParts.push(`• Event Date: ${parsedDateDisplay}`);
  if (formData.city)             reqParts.push(`• City: ${formData.city}`);
  if (guestCount)                reqParts.push(`• Guest Count: ${guestCount}`);
  if (mealService)               reqParts.push(`• Meal Service: ${mealService}`);
  if (menuType)                  reqParts.push(`• Menu Type: ${menuType}`);
  if (foodServingStyle)          reqParts.push(`• Food Serving Style: ${foodServingStyle}`);
  if (budget)                    reqParts.push(`• Budget: ${budget}`);

  // Any remaining fields not already captured above
  const alreadyHandled = new Set([
    "customer_name", "phone_number", "event_type", "event_date",
    "city", "guest_count", "meal_service", "menu_type", "food_serving_style", "budget",
  ]);
  for (const [key, value] of Object.entries(formData)) {
    if (!alreadyHandled.has(key)) {
      reqParts.push(`• ${formatInteraktKey(key)}: ${value}`);
    }
  }

  const formattedRequirements = reqParts.join("\n");

  // ── Data column cells ────────────────────────────────────────────────────
  const dataFields = [];
  if (customerName) {
    dataFields.push({ column_id: "Col09RF5UT17H", rich_text: [rtBlock(customerName)] });        // Name
  }
  if (phoneNumber) {
    dataFields.push({ column_id: "Col09RT7905KP", phone: [phoneNumber] });                       // Contact
  }
  dataFields.push({ column_id: "Col0AER5B6P5J", rich_text: [rtBlock(formattedRequirements)] }); // Requirements Notes (safety net — full data always here)

  // ── Address / City ──────────────────────────────────────────────────────
  if (city) {
    dataFields.push({ column_id: "Col09S07W0UUC", rich_text: [rtBlock(city)] });
    console.log(`${LOG} [TICKET] City mapped: "${city}"`);
  }

  // ── Event Type dropdown ──────────────────────────────────────────────────
  if (eventType) {
    const eventTypeOption = mapEventTypeToOption(eventType);
    if (eventTypeOption) {
      dataFields.push({ column_id: "Col09S07MSP6Y", select: [eventTypeOption] });
      console.log(`${LOG} [TICKET] Event type mapped: "${eventType}" → ${eventTypeOption}`);
    } else {
      console.warn(`${LOG} [TICKET] Event type not mapped to a Slack option: "${eventType}" — skipping dropdown`);
    }
  }

  // ── Event Date field (enhanced parser with today/tomorrow/Indian formats) ─
  if (rawEventDate) {
    if (parsedDateIso) {
      dataFields.push({ column_id: "Col0AD8JDTHTJ", date: [parsedDateIso] });
      console.log(`${LOG} [TICKET] Event date parsed: "${rawEventDate}" → ${parsedDateIso} (display: ${parsedDateDisplay})`);
    } else {
      console.warn(`${LOG} [TICKET] Could not parse event_date: "${rawEventDate}" — skipping date field, value is in requirements`);
    }
  }

  // ── Vendor Services (multi-select) ────────────────────────────────────────
  // Handles explicit services_needed array AND infers catering if meal_service present.
  const rawServices = formData.services_needed;
  const servicesArray = rawServices
    ? (Array.isArray(rawServices)
        ? [...rawServices]
        : typeof rawServices === "string"
          ? rawServices.split(",").map((s) => s.trim())
          : [])
    : [];

  // If the caterer flow sends meal_service / menu_type, auto-infer catering service
  if (mealService || menuType || foodServingStyle) {
    const hasCatering = servicesArray.some((s) => s.toLowerCase().includes("cater"));
    if (!hasCatering) servicesArray.push("catering");
  }

  if (servicesArray.length > 0) {
    const servicesOptions = mapServicesToOptions(servicesArray);
    if (servicesOptions.length > 0) {
      dataFields.push({ column_id: "Col0AMM0VJXR8", select: servicesOptions });
      console.log(`${LOG} [TICKET] Services mapped: ${servicesArray.join(", ")} → ${servicesOptions.join(", ")}`);
    } else {
      console.warn(`${LOG} [TICKET] Services received but none mapped to options: ${servicesArray.join(", ")}`);
    }
  }

  // ── Caterer-specific: Guest Count / Budget ────────────────────────────────
  // Captured in Requirements (see above). If your Slack list gets dedicated
  // "Guest Count" / "Budget" columns, add the pushes here, e.g.:
  //   dataFields.push({ column_id: "<YOUR_GUEST_COUNT_COLUMN_ID>", rich_text: [rtBlock(String(guestCount))] });
  if (guestCount) {
    console.log(`${LOG} [TICKET] Guest count (in requirements): "${guestCount}"`);
  }
  if (budget) {
    console.log(`${LOG} [TICKET] Budget (in requirements): "${budget}"`);
  }

  // ── Webhook requirements string ───────────────────────────────────────────
  // (mirrors the format the original Interakt template used: answer_6..answer_10)
  const webhookRequirementsParts = [];
  if (guestCount)        webhookRequirementsParts.push(`Guests: ${guestCount}`);
  if (mealService)       webhookRequirementsParts.push(`Meal Service: ${mealService}`);
  if (menuType)          webhookRequirementsParts.push(`Menu: ${menuType}`);
  if (foodServingStyle)  webhookRequirementsParts.push(`Serving Style: ${foodServingStyle}`);
  if (budget)            webhookRequirementsParts.push(`Budget: ${budget}`);
  // Fallback: if none of the above are present, include all remaining formData keys
  if (webhookRequirementsParts.length === 0) {
    for (const [key, value] of Object.entries(formData)) {
      if (!["customer_name", "phone_number", "event_type", "event_date", "city"].includes(key)) {
        webhookRequirementsParts.push(`${formatInteraktKey(key)}: ${value}`);
      }
    }
  }

  return {
    customerName,
    phoneNumber,
    eventType,
    city,
    formattedRequirements,
    dataFields,
    webhook: {
      event_type:    eventType || "",
      // event_details = date + city  (mirrors {{answer_3}} {{answer_4}})
      event_details: `${parsedDateDisplay || ""} ${city}`.trim(),
      // event_venue = meal service for caterer, venue_setting for others
      event_venue:   mealService || formData.venue_setting || "",
      // requirements = all caterer-specific answers (mirrors {{answer_6}}..{{answer_10}})
      requirements:  webhookRequirementsParts.join(" | "),
    },
  };
};

/**
 * Fires the Slack channel notification webhook. Isolated try/catch — a failure
 * here MUST NOT propagate as 500 to Interakt (the ticket is the source of truth).
 */
const fireInteraktChannelNotification = async (webhookUrl, details, ticketId, triggerMessage, LOG) => {
  const webhookPayload = {
    customer_name:   details.customerName || "Unknown",
    phone_number:    details.phoneNumber,
    ticket_id:       ticketId,
    trigger_message: triggerMessage,
    text:            triggerMessage,
    ...details.webhook,
  };

  console.log(`${LOG} [WEBHOOK] Firing channel notification. trigger_message="${webhookPayload.trigger_message}"`);

  try {
    const webhookResponse = await axios.post(webhookUrl, webhookPayload);
    console.log(`${LOG} [WEBHOOK] Notification sent. HTTP ${webhookResponse.status}`);
  } catch (webhookError) {
    console.error(
      `${LOG} [WEBHOOK] Notification failed (ticket already saved — non-blocking). Error:`,
      webhookError.response?.data || webhookError.message,
    );
  }
};

/**
 * Processes lead data from Interakt, maps the strings to Slack Option IDs,
 * creates or updates a Slack List ticket, and fires the channel webhook notification.
 *
 * KEY BEHAVIORS:
 * - Upsert: Interakt calls this more than once per lead (first with name + phone,
 *   later with all answers). If an Interakt enquiry for the same phone exists within
 *   INTERAKT_LOOKBACK_MS and already has a ticket, the new non-empty fields are merged
 *   into it and the ticket's data columns are updated (Status / Sales-exec untouched).
 *   Empty values never overwrite existing ones.
 * - No lost leads: the enquiry is saved as PROCESSING before the ticket exists and only
 *   marked FLOW_COMPLETE once slackLists.items.create succeeds. If ticket creation fails,
 *   Interakt's retry reuses that enquiry and creates the ticket for it.
 * - Graceful webhook: Webhook failure does NOT bubble up as 500 — the ticket is the
 *   source of truth.
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
    const phoneNumber = String(payload.phone_number ?? "").trim();
    const incomingFields = pickNonEmptyInteraktFields(payload);
    incomingFields.phone_number = phoneNumber;

    console.log(
      `${LOG} Customer: "${incomingFields.customer_name ?? "Unknown"}" | Phone: ${phoneNumber} | ` +
      `Event: ${incomingFields.event_type ?? ""} | City: ${incomingFields.city ?? ""}`
    );
    console.log(`${LOG} isLocal=${isLocal} | isDev=${isDev} | forceLive=${forceLive}`);

    const dbConnected = !!(mongoose.connection && mongoose.connection.readyState === 1);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: LOOK UP EXISTING ENQUIRY FOR THIS PHONE
    // Most recent Interakt enquiry in the lookback window. If it has a
    // slack_ticket_id → update that ticket. If it has none (an earlier ticket
    // creation failed) → reuse it and create the ticket for it.
    // ─────────────────────────────────────────────────────────────────────
    let existingEnquiry = null;
    if (dbConnected) {
      const cutoff = new Date(Date.now() - INTERAKT_LOOKBACK_MS);
      existingEnquiry = await CustomerEnquiry.findOne({
        phone_number: phoneNumber,
        source: "interakt",
        created_at: { $gte: cutoff },
      }).sort({ created_at: -1 });

      if (existingEnquiry) {
        console.log(
          `${LOG} [LOOKUP] Found enquiry ${existingEnquiry.enquiry_id} (status=${existingEnquiry.status}, ` +
          `slack_ticket_id=${existingEnquiry.slack_ticket_id || "none"}, created_at=${existingEnquiry.created_at?.toISOString()}).`
        );
      } else {
        console.log(`${LOG} [LOOKUP] No Interakt enquiry for phone ${phoneNumber} in last 24h. Will create a new ticket.`);
      }
    } else {
      console.warn(`${LOG} [LOOKUP] MongoDB not connected (readyState=${mongoose.connection?.readyState}). Will create a new ticket.`);
    }

    const existingTicketId = existingEnquiry?.slack_ticket_id || null;

    // New non-empty values win; empty values never overwrite existing ones.
    const existingFormData =
      existingEnquiry?.formData && typeof existingEnquiry.formData === "object" ? existingEnquiry.formData : {};
    const formData = { ...existingFormData, ...incomingFields };

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: MOCK MODE
    // ─────────────────────────────────────────────────────────────────────
    if ((isLocal || isDev) && !forceLive) {
      console.log(`${LOG} [MOCK] Local/dev env detected — not hitting Slack APIs.`);
      if (existingTicketId) {
        console.log(`${LOG} [MOCK] Would UPDATE ticket ${existingTicketId} for: ${formData.customer_name ?? "Unknown"} (${phoneNumber})`);
      } else {
        console.log(`${LOG} [MOCK] Would CREATE ticket for: ${formData.customer_name ?? "Unknown"} (${phoneNumber})`);
      }
      console.log(`${LOG} ============================================================`);
      return { success: true, mock: true, updated: !!existingTicketId };
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: BUILD FORMATTED REQUIREMENTS + DATA COLUMNS (from merged data)
    // ─────────────────────────────────────────────────────────────────────
    const details = buildInteraktLeadDetails(formData, LOG);

    console.log(`${LOG} [DATA] Merged keys: ${Object.keys(formData).join(", ")}`);
    console.log(`${LOG} [DATA] Requirements:\n${details.formattedRequirements}`);

    const enquiryDataUpdate = {
      formData,
      ...(details.customerName && { customer_name: details.customerName }),
      ...(details.eventType && { event_type: details.eventType }),
      ...(details.city && { city: details.city }),
    };

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4a: UPDATE PATH — ticket already exists for this lead
    // Only data columns are updated; Status / Sales-exec may have been
    // changed by sales and must not be reset.
    // ─────────────────────────────────────────────────────────────────────
    if (existingTicketId) {
      try {
        await CustomerEnquiry.updateOne({ _id: existingEnquiry._id }, { $set: enquiryDataUpdate });
        console.log(`${LOG} [DB] Merged new data into enquiry ${existingEnquiry.enquiry_id}.`);
      } catch (dbErr) {
        console.error(`${LOG} [DB] Failed to update enquiry (non-blocking):`, dbErr.message);
      }

      console.log(`${LOG} [SLACK] Calling slackLists.items.update on ticket ${existingTicketId}...`);
      const updated = await updateSlackListItem(token, INTERAKT_SLACK_LIST_ID, existingTicketId, details.dataFields);
      if (!updated) {
        console.error(`${LOG} [SLACK] Ticket update failed for ${existingTicketId}.`);
        return { success: false, error: "Failed to update Slack List ticket." };
      }
      console.log(`${LOG} [SLACK] Ticket updated. slack_item_id=${existingTicketId}`);

      await fireInteraktChannelNotification(
        webhookUrl,
        details,
        existingTicketId,
        `📝 Lead updated: ${details.customerName || "Unknown"}`,
        LOG,
      );

      console.log(`${LOG} [DONE] updated ticket_id=${existingTicketId} | enquiry_id=${existingEnquiry.enquiry_id}`);
      console.log(`${LOG} ============================================================`);
      return { success: true, ticket_id: existingTicketId, updated: true };
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4b: CREATE PATH — save enquiry as PROCESSING (not FLOW_COMPLETE)
    // so a failed ticket creation is retried instead of being treated as done.
    // Note: two hits racing with no ticket yet could both create a ticket;
    // Interakt's hits for a lead are minutes apart so we accept that.
    // ─────────────────────────────────────────────────────────────────────
    let savedEnquiry = null;
    if (existingEnquiry) {
      // Enquiry from a previous attempt whose ticket creation failed — reuse it.
      try {
        await CustomerEnquiry.updateOne({ _id: existingEnquiry._id }, { $set: enquiryDataUpdate });
        console.log(`${LOG} [DB] Reusing enquiry ${existingEnquiry.enquiry_id} (no ticket yet) — merged new data.`);
      } catch (dbErr) {
        console.error(`${LOG} [DB] Failed to update enquiry (non-blocking):`, dbErr.message);
      }
      savedEnquiry = existingEnquiry;
    } else if (dbConnected) {
      try {
        savedEnquiry = await CustomerEnquiry.create({
          ...enquiryDataUpdate,
          customer_name: details.customerName || "Unknown",
          phone_number: phoneNumber,
          source: "interakt",
          status: "PROCESSING",
        });
        console.log(`${LOG} [DB] Enquiry saved as PROCESSING. enquiry_id=${savedEnquiry.enquiry_id}`);
      } catch (dbErr) {
        console.error(`${LOG} [DB] Failed to save enquiry (non-blocking):`, dbErr.message);
      }
    } else {
      console.warn(`${LOG} [DB] MongoDB not connected — skipping DB save.`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: CREATE SLACK LIST TICKET
    // ─────────────────────────────────────────────────────────────────────
    const initialFields = [
      ...details.dataFields,
      { column_id: "Col09RT68ATPX", select: ["OptU8ED23MH"] },                       // Status: Interested
      { column_id: "Col09RWKYMG74", user: ["U0B7QRK29HA"] },                         // Sales-exec: Shubhi
      { column_id: "Col09RWLBV0TC", rich_text: [rtBlock("WhatsApp (Interakt)")] },   // Lead Source
    ];
    if (!details.customerName) {
      initialFields.push({ column_id: "Col09RF5UT17H", rich_text: [rtBlock("Unknown")] }); // Name placeholder
    }

    console.log(`${LOG} [SLACK] Calling slackLists.items.create...`);

    const listResponse = await axios.post(
      "https://slack.com/api/slackLists.items.create",
      { list_id: INTERAKT_SLACK_LIST_ID, initial_fields: initialFields },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } },
    );

    console.log(`${LOG} [SLACK] slackLists.items.create response: ok=${listResponse.data?.ok}`);

    if (!listResponse.data || !listResponse.data.ok) {
      console.error(`${LOG} [SLACK] Ticket creation failed. Response:`, JSON.stringify(listResponse.data));
      return { success: false, error: "Failed to create Slack List ticket." };
    }

    const slack_item_id = listResponse.data.item?.id || "";
    console.log(`${LOG} [SLACK] Ticket created. slack_item_id=${slack_item_id}`);

    // Ticket exists — now mark the enquiry complete with its slack_ticket_id
    if (savedEnquiry) {
      try {
        await CustomerEnquiry.updateOne(
          { _id: savedEnquiry._id },
          { $set: { slack_ticket_id: slack_item_id, status: "FLOW_COMPLETE" } },
        );
        console.log(`${LOG} [DB] Enquiry ${savedEnquiry.enquiry_id} → FLOW_COMPLETE, slack_ticket_id=${slack_item_id}`);
      } catch (updateErr) {
        console.error(`${LOG} [DB] Failed to update slack_ticket_id (non-blocking):`, updateErr.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 6: FIRE CHANNEL NOTIFICATION (isolated try/catch)
    // Matches the exact Slack trigger webhook format:
    //   trigger_message, event_type, event_details, event_venue, requirements
    // ─────────────────────────────────────────────────────────────────────
    await fireInteraktChannelNotification(
      webhookUrl,
      details,
      slack_item_id,
      `📩 New Eventory Lead: ${details.customerName || "Unknown"}`,
      LOG,
    );

    console.log(`${LOG} [DONE] ticket_id=${slack_item_id} | enquiry_id=${savedEnquiry?.enquiry_id}`);
    console.log(`${LOG} ============================================================`);

    return { success: true, ticket_id: slack_item_id, updated: false };
  } catch (error) {
    console.error(`${LOG} [FATAL] Unhandled error:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};
