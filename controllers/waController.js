import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

async function sendInvoiceToWhatsApp(invoiceData, customerPhone) {
    // WhatsApp Business API configuration
    const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${process.env.PHONE_NUMBER_ID}`;

    const headers = {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
    };
    try {
        // Format invoice message
        const messageResponse = await axios.post(
            `${baseUrl}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: customerPhone,
                type: "document",
                document: {
                    link: invoiceData,
                    caption: "Your invoice is ready!"
                }
            },
            { headers }
        );

        // Send message via WhatsApp Business API


        console.log('Invoice sent successfully:', response.data);
        return messageResponse.data;

    } catch (error) {
        console.error('Error sending invoice:', error.message);
        throw error;
    }
}

// Example usage
const invoice = {
    invoiceNumber: "INV-2024-001",
    date: "2024-03-20",
    amount: 299.99,
    items: [
        { name: "Product A", price: 199.99 },
        { name: "Product B", price: 100.00 }
    ],
    totalAmount: 299.99,
    dueDate: "2024-04-20"
};

sendInvoiceToWhatsApp(invoice, "1234567890")
    .then(result => console.log('Success:', result))
    .catch(error => console.error('Error:', error));