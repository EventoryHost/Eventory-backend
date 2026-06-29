import mongoose from "mongoose";

const whatsappMessageSchema = new mongoose.Schema(
  {
    waId: {
      type: String,
      required: true,
      unique: true,
    },
    text: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ["incoming", "outgoing"],
      required: true,
    },
    senderNumber: {
      type: String,
      required: true,
    },
    receiverNumber: {
      type: String,
      required: true,
    },
    raw: {
      type: Object,
    },
  },
  {
    timestamps: true,
  },
);

const WhatsappMessage = mongoose.model(
  "WhatsappMessage",
  whatsappMessageSchema,
);

export default WhatsappMessage;
