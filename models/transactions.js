import { mongoose, Schema as _Schema } from "mongoose";

const Schema = _Schema;

const transactionSchema = new Schema(
  {
    quotation_id: { type: String, index: true, required: true },
    internalOrderId: { type: String, index: true, required: true },
    vendor_id: { type: String, index: true, required: true },
    customer_id: { type: String, index: true, required: true },
    service_id: { type: String, index: true, required: true },

    pgOrderId: { type: String, index: true },
    pgStatus: { type: String },

    transfer_id: { type: String, index: true, unique: true },
    cf_transfer_id: { type: String, index: true },
    status: { type: String, index: true },
    transfer_amount: { type: Number },
    transfer_mode: { type: String },
    added_on: { type: Date },
    updated_on: { type: Date },

    payment_type: { type: String, index: true },

    beneficiary_id: { type: String, index: true },

    paymentDetails: {
      customerPayable: {
        total: { type: Number, default: 0 },
        baseAmount: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        convenienceFee: { type: Number, default: 0 },
        taxOnConvenience: { type: Number, default: 0 },
      },
      vendorReceivable: {
        total: { type: Number, default: 0 },
        baseAmount: { type: Number, default: 0 },
        commission: { type: Number, default: 0 },
        taxOnCommission: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true },
);

export const Transaction = mongoose.model("Transactions", transactionSchema);
