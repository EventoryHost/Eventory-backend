import axios from "axios";
import dotenv from "dotenv";
import CustomerEnquiry from "../models/customerEnquiry.js";
import mongoose from "mongoose";

dotenv.config();

const mapEventTypeToOption = (typeStr) => {
  if (!typeStr) return null;
  const normalized = typeStr.toLowerCase().trim();
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
  if (
    normalized.includes("party") ||
    normalized.includes("gathering") ||
    normalized.includes("celebration")
  )
    return "OptLN3OHB18";
  if (normalized.includes("reception")) return "OptKP6ZUE08";
  if (normalized.includes("proposal")) return "OptWEJ8HPHZ";
  return null;
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
 * @param {Object} data - Plain text lead details from Interakt
 */
export const triggerInteraktSlackIntegration = async (data) => {
  try {
    const token = process.env.SLACK_LISTS_BEARER_TOKEN;
    const webhookUrl = process.env.SLACK_TRIGGER_WEBHOOK_URL;

    if (!token || !webhookUrl) {
      console.warn(
        "[SLACK_INTEGRATION] Missing SLACK_LISTS_BEARER_TOKEN or SLACK_TRIGGER_WEBHOOK_URL in environment. Skipping.",
      );
      return { success: false, error: "Missing Slack environment variables." };
    }

    const isLocal = process.env.IS_LOCAL === "true";
    const isDev = process.env.IS_DEV === "true";
    const forceLive = process.env.FORCE_SLACK_NOTIFICATIONS === "true";

    const payload = data || {};

    // Extract indexing fields
    const customerName = payload.customer_name ?? "Unknown";
    const phoneNumber = payload.phone_number ?? "";
    const eventType = payload.event_type ?? "";
    const city = payload.city ?? "";

    // Format function for snake_case keys to Title Case
    const formatKey = (key) => {
      return key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    // Construct dynamic formData
    const formData = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null && value !== "") {
        formData[key] = value;
      }
    }

    // Dynamically build Requirements Notes and Slack Message
    const reqParts = [`• Lead Source: WhatsApp (Interakt)`];
    let slackMessage = "📩 New Eventory Lead\n\n";

    for (const [key, value] of Object.entries(formData)) {
      const formattedKey = formatKey(key);
      reqParts.push(`• ${formattedKey}: ${value}`);
      slackMessage += `${formattedKey}: ${value}\n\n`;
    }

    const formattedRequirements = reqParts.join("\n");
    slackMessage = slackMessage.trim();

    // Create Mongoose db record for audit/fallback tracking
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
        console.log(
          `[SLACK_INTEGRATION_INTERAKT] Saved enquiry to DB with ID: ${savedEnquiry.enquiry_id}`,
        );
      } catch (dbErr) {
        console.error(
          "[SLACK_INTEGRATION_INTERAKT] Failed to save enquiry to MongoDB:",
          dbErr,
        );
      }
    }

    if ((isLocal || isDev) && !forceLive) {
      console.log(
        "--------------------------------------------------------------------------------",
      );
      console.log(`[SLACK_INTEGRATION] [INTERAKT MOCK RUN]`);
      console.log(
        `[SLACK_INTEGRATION] Customer Name: ${customerName}, Phone: ${phoneNumber}`,
      );
      console.log(
        `[SLACK_INTEGRATION] Event Type: ${eventType}, City: ${city}`,
      );
      console.log(
        "--------------------------------------------------------------------------------",
      );
      return { success: true, mock: true };
    }

    // Build list item payload
    const initialFields = [
      {
        column_id: "Col09RF5UT17H", // Name
        rich_text: [
          {
            type: "rich_text",
            elements: [
              {
                type: "rich_text_section",
                elements: [
                  {
                    type: "text",
                    text: customerName,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        column_id: "Col09RT7905KP", // Contact
        phone: [phoneNumber],
      },
      {
        column_id: "Col09RT68ATPX", // Status: Interested
        select: ["OptU8ED23MH"],
      },
      {
        column_id: "Col09RWKYMG74", // Sales-exec: Shubhi
        user: ["U0B7QRK29HA"],
      },
      {
        column_id: "Col09RWLBV0TC", // Lead Source
        rich_text: [
          {
            type: "rich_text",
            elements: [
              {
                type: "rich_text_section",
                elements: [
                  {
                    type: "text",
                    text: "WhatsApp (Interakt)",
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

    // Address/City Column
    if (city) {
      initialFields.push({
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
                    text: city,
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    // Map Event Type select dropdown
    if (eventType) {
      const eventTypeOption = mapEventTypeToOption(eventType);
      if (eventTypeOption) {
        initialFields.push({
          column_id: "Col09S07MSP6Y",
          select: [eventTypeOption],
        });
      }
    }

    // Map Event Date datepicker field safely (only if it is a parseable date)
    const rawEventDate = payload.event_date;
    if (rawEventDate) {
      const parsedTime = Date.parse(rawEventDate);
      if (!isNaN(parsedTime)) {
        const dateStr = new Date(parsedTime).toISOString().split("T")[0];
        initialFields.push({
          column_id: "Col0AD8JDTHTJ",
          date: [dateStr],
        });
      }
    }

    // Map Vendor Services multi-select dropdown if present
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
          initialFields.push({
            column_id: "Col0AMM0VJXR8",
            select: servicesOptions,
          });
        }
      }
    }

    console.log(
      `[SLACK_INTEGRATION_INTERAKT] Creating Slack List ticket for Interakt lead...`,
    );
    const slackPayload = {
      list_id: "F09RT5WG6Q5",
      initial_fields: initialFields,
    };
    console.log("Slack Payload:");
    console.log(JSON.stringify(slackPayload, null, 2));

    const listResponse = await axios.post(
      "https://slack.com/api/slackLists.items.create",
      slackPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Slack Response:");
    console.log(JSON.stringify(listResponse.data, null, 2));

    if (!listResponse.data || !listResponse.data.ok) {
      console.error(
        "[SLACK_INTEGRATION_INTERAKT] Failed to create Slack List item. Response:",
        listResponse.data,
      );
      return { success: false, error: "Failed to create Slack List ticket." };
    }

    const slack_item_id = listResponse.data.item?.id || "";
    console.log(
      `[SLACK_INTEGRATION_INTERAKT] Slack List ticket created with ID: ${slack_item_id}`,
    );

    // Update MongoDB enquiry record with the slack_ticket_id
    if (savedEnquiry) {
      await CustomerEnquiry.updateOne(
        { enquiry_id: savedEnquiry.enquiry_id },
        { $set: { slack_ticket_id: slack_item_id } },
      );
    }

    // Send channel notification webhook
    const webhookPayload = {
      customer_name: customerName,
      phone_number: phoneNumber,
      ticket_id: slack_item_id,
      trigger_message: slackMessage,
      text: slackMessage,
      event_type: eventType,
      event_details: `${payload.event_date || ""} ${city}`.trim(),
      event_venue: payload.venue_setting || "",
      requirements: slackMessage,
    };

    console.log(
      "[SLACK_INTEGRATION_INTERAKT] Triggering channel notification webhook...",
    );
    const webhookResponse = await axios.post(webhookUrl, webhookPayload);
    console.log(
      `[SLACK_INTEGRATION_INTERAKT] Webhook triggered successfully. Status: ${webhookResponse.status}`,
    );

    return { success: true, ticket_id: slack_item_id };
  } catch (error) {
    console.error(
      "[SLACK_INTEGRATION_INTERAKT] Error in Interakt Slack integration flow:",
      error.response?.data || error.message,
    );
    return { success: false, error: error.message };
  }
};
