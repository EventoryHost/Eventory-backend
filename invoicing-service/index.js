import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { generateVendorOnboardedInvoice } from "./generateInvoice.js";
import { generateAndStoreAgreement } from "./generateAgreement.js";
import dotenv from "dotenv";

dotenv.config();

const sqs = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

const queueUrl =
  "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue";

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
        console.log(`Processing ${data.Messages.length} messages`);

        for (const message of data.Messages) {
          const body = JSON.parse(message.Body);
          const messageType = body.type;

          console.log(`Processing message type: ${messageType}`);

          try {
            if (messageType === "vendorOnboarded") {
              if (!body.customer || !body.paymentDetails) {
                throw new Error(
                  "Invalid vendorOnboarded message: missing customer or paymentDetails"
                );
              }

              await generateVendorOnboardedInvoice(
                body.customer,
                body.paymentDetails
              );
              console.log(
                "✅ Vendor onboarded invoice generated successfully."
              );
            } else if (messageType === "agreement") {
              if (!body.serviceType || !body.vendorId || !body.agreementData) {
                throw new Error(
                  "Invalid agreement message: missing serviceType, vendorId, or agreementData"
                );
              }

              await generateAndStoreAgreement(
                body.serviceType,
                body.vendorId,
                body.agreementData
              );
              console.log("✅ Agreement generated successfully.");
            } else {
              console.error(
                `Unknown message type: ${messageType}. Skipping message.`
              );
            }

            const delCommand = new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            });
            await sqs.send(delCommand);
          } catch (err) {
            console.error(
              `Processing failed for message type ${messageType}:`,
              err
            );

            const delCommand = new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            });
            await sqs.send(delCommand);
          }
        }
      }
    } catch (error) {
      console.error("SQS polling error:", error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

pollSQS().catch(console.error);
