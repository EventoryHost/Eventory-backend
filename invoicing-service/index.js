import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { generateVendorOnboardedInvoice } from "./generateInvoice.js";
import { generateAndStoreAgreement } from "./generateAgreement.js";
import dotenv from "dotenv";

dotenv.config();

const sqs = new SQSClient({
  region: process.env.AWS_REGION, 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET
  }
});

const queueUrl = "https://sqs.ap-south-1.amazonaws.com/637423195802/invoice-queue";

async function pollSQS() {
  console.log("Starting SQS polling service for invoicing and agreements...");
  
  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 300
      });

      const data = await sqs.send(command);

      if (data.Messages) {
        console.log(`Processing ${data.Messages.length} messages`);
        
        for (const message of data.Messages) {
          const body = JSON.parse(message.Body);
          const messageType = body.type || 1; 
          
          console.log(`Processing message type: ${messageType}`);

          try {
            switch (messageType) {
              case 1:
                // Invoice generation
                if (!body.customer || !body.paymentDetails) {
                  throw new Error("Invalid invoice message: missing customer or paymentDetails");
                }
                await generateVendorOnboardedInvoice(body.customer, body.paymentDetails);
                break;
                
              case 2:
                // Agreement generation
                if (!body.serviceType || !body.vendorId || !body.agreementData) {
                  throw new Error("Invalid agreement message: missing serviceType, vendorId, or agreementData");
                }
                await generateAndStoreAgreement(body.serviceType, body.vendorId, body.agreementData);
                break;
                
              default:
                console.error(`Unknown message type: ${messageType}. Skipping message.`);
                break;
            }

            const delCommand = new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle
            });
            await sqs.send(delCommand);
            
          } catch (err) {
            console.error(`Processing failed for message type ${messageType}:`, err);
            
            const delCommand = new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle
            });
            await sqs.send(delCommand);
          }
        }
      }
    } catch (error) {
      console.error("SQS polling error:", error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

pollSQS().catch(console.error);