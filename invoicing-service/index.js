import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { generateBookingPaymentInvoice, generateVendorOnboardedInvoice } from "./generateInvoice.js";

const sqs = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

const queueUrl =
  "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue";

console.log("running")
async function pollSQS() {
  console.log("Starting SQS polling service for invoicing and agreements...");

  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 300,
      });

      const data = await sqs.send(command);

      if (data.Messages) {
        for (const message of data.Messages) {
          const body = JSON.parse(message.Body);

          try {
            if (body.type === "vendorOnboarded") {
              await generateVendorOnboardedInvoice(body.customer, body.paymentDetails);

            } else {
              await generateBookingPaymentInvoice(body.customer, body.vendor, body.paymentDetails);
            }

            const delCommand = new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle
            });
            await sqs.send(delCommand);
          } catch (err) {
            console.error("Invoice generation failed:", err);
          }
        }
      }

    } catch (err) {
      console.error("Error polling SQS:", err);
    }
  }
}
pollSQS().catch(console.error);
