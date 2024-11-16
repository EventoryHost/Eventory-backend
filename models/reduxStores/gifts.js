import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const giftSchema = new Schema(
  {
    userId: {
      type: String,
    },
    pageNumber: { type: Number, default: 1 },
    vendorName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    venueType: { type: String, default: "gift" },
    minimumOrderQuantity: {
      type: String,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    bulkQuantityAvailable: {
      type: Boolean,
      default: false,
    },
    customizableGifts: {
      type: Boolean,
      default: false,
    },
    listOfGifts: [String],

    priceRange: {
      min: {
        type: String,
      },
      max: {
        type: String,
      },
    },

    deliveryCharges: {
      max: {
        type: String,
      },
      min: {
        type: String,
      },
    },
    termsAndConditions: {
      type: [String],
      trim: true,
    },
  },
  { timestamps: true },
);

const GiftModel = model("ReduxGifts", giftSchema);

export default GiftModel;
