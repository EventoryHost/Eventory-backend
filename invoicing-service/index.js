import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { generateVendorOnboardedInvoice } from "./generateInvoice.js";

const sqs = new SQSClient({
  region: process.env.AWS_REGION, credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET
  }
});
const queueUrl = "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue"

async function pollSQS() {
  while (true) {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 300
    });

    const data = await sqs.send(command);

    if (data.Messages) {
      console.log("Received messages:", data.Messages);
      for (const message of data.Messages) {

        const body = JSON.parse(message.Body);

        try {
          await generateVendorOnboardedInvoice(body.customer, body.paymentDetails);
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
  }
}

pollSQS().catch(console.error);