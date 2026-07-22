import mongoose from "mongoose";

// Single-document collection holding the destination for the printed QR cards.
// The document always has _id = "main"; only destinationUrl ever changes.
const redirectSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "main",
    },
    destinationUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Redirect = mongoose.model("Redirect", redirectSchema);

export const REDIRECT_DOC_ID = "main";
export const DEFAULT_DESTINATION_URL = "https://wa.me/9198800725840";

// Creates the config document on first boot and never touches it afterwards.
// $setOnInsert + upsert keeps this atomic, so concurrent instances starting at
// the same time can't overwrite each other or the existing URL.
export const seedRedirectConfig = async () => {
  try {
    const result = await Redirect.findOneAndUpdate(
      { _id: REDIRECT_DOC_ID },
      { $setOnInsert: { destinationUrl: DEFAULT_DESTINATION_URL } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    console.log(`🔗 Redirect config ready → ${result.destinationUrl}`);
  } catch (error) {
    // Never crash the server over seeding; the route handles a missing doc.
    console.error("Redirect config seeding error:", error.message);
  }
};

export default Redirect;
