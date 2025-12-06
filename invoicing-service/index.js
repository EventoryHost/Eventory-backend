import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { generateBookingPaymentInvoice, generateVendorOnboardedInvoice } from "./generateInvoice.js";
import { generateAndStoreAgreement } from "./generateAgreement.js";
import dotenv from "dotenv";

dotenv.config();

const sqs = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const queueUrl = process.env.IS_DEV ? "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-test-queue" :
  "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue";

console.log("Starting SQS polling service for invoicing and agreements...");

async function pollSQS() {
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
        console.log(`Processing ${data.Messages.length} message(s)`);

        for (const message of data.Messages) {
          const body = JSON.parse(message.Body);
          const messageType = body.type;

          console.log(`Processing message type: ${messageType}`);

          try {
            if (messageType === "vendorOnboarded" || messageType === 1) {
              // Vendor onboarded invoice
              if (!body.customer || !body.paymentDetails) {
                throw new Error("Invalid vendor onboarded message: missing customer or paymentDetails");
              }
              await generateVendorOnboardedInvoice(body.customer, body.paymentDetails);
              
            } else if (messageType === 2) {
              // Agreement generation
              if (!body.serviceType || !body.vendorId || !body.agreementData) {
                throw new Error("Invalid agreement message: missing serviceType, vendorId, or agreementData");
              }
              await generateAndStoreAgreement(body.serviceType, body.vendorId, body.agreementData);
              
            } else {
              await generateBookingPaymentInvoice(body.customer, body.vendor, body.paymentDetails);
            }

            const delCommand = new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            });
            await sqs.send(delCommand);
            console.log(`Message processed and deleted successfully`);

          } catch (err) {
            console.error(`Processing failed for message type ${messageType}:`, err);
          }
        }
      }
    } catch (error) {
      console.error("SQS polling error:", error);
    }
  }
}
pollSQS().catch(console.error);