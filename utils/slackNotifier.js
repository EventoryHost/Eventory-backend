import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";

dotenv.config();

const accessToken = process.env.SLACK_ACCESS_TOKEN;
const channelId = process.env.SLACK_CHANNEL_ID;

const slackClient = new WebClient(accessToken);
export async function sendSlackMessage({
  id,
  customer,
  service,
  vendorId,
  guests,
  date,
}) {
  try {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: `New Quotation Created`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🆕 New Quotation Received",
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Quotation ID:*\n${id}`,
            },
            {
              type: "mrkdwn",
              text: `*Event Date:*\n${date}`,
            },
            {
              type: "mrkdwn",
              text: `*Customer:*\n${customer}`,
            },
            {
              type: "mrkdwn",
              text: `*Service ID:*\n${service}`,
            },
            {
              type: "mrkdwn",
              text: `*Vendor ID:*\n${vendorId}`,
            },
            {
              type: "mrkdwn",
              text: `*Guests:*\n${guests}`,
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🔗 *View in Dashboard:* <https://admin.eventory.in>`,
          },
        },
      ],
    });
  } catch (error) {
    console.error("Slack Message Error:", error?.message || error);
  }
}
export async function sendSlackBookingMessage({
  bookingid,
  customer,
  vendorId,
  serviceName,
  guest,
  startDate,
}) {
  try {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: `New Booking Created`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🆕 New Booking Confirmed",
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Booking ID:*\n${bookingid}`,
            },
            {
              type: "mrkdwn",
              text: `*Event Date:*\n${startDate}`,
            },
            {
              type: "mrkdwn",
              text: `*Customer:*\n${customer}`,
            },
            {
              type: "mrkdwn",
              text: `*Vendor ID:*\n${vendorId}`,
            },
            {
              type: "mrkdwn",
              text: `*Service:*\n${serviceName}`,
            },
            {
              type: "mrkdwn",
              text: `*Guests:*\n${guest}`,
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🔗 *View in Admin Dashboard:* <https://admin.eventory.in>`,
          },
        },
      ],
    });
  } catch (error) {
    console.error("Slack Booking Message Error:", error?.message || error);
  }
}
