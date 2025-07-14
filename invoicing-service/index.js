import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import generateInvoice from "./generateInvoice.js";

const sqs = new SQSClient({ region: process.env.AWS_REGION });
const queueUrl = process.env.SQS_QUEUE_URL;

async function pollSQS() {
  while (true) {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20, // long polling
      VisibilityTimeout: 300 // adjust as needed
    });

    const data = await sqs.send(command);

    if (data.Messages) {
      for (const message of data.Messages) {
        const body = JSON.parse(message.Body);

        try {
          await generateInvoice(body.customer, body.paymentDetails);
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