import MakeupArtist from "../../models/makeupArtists.js";
import { Vendor as User } from "../../models/users.js";


const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createMakeupArtist = async (req, res) => {
  try {
    console.log("Received Data:", req.body); // 🛠️ Log full request body

    const requiredFields = [
      "artistName", "artistDescription", "eventSize", "eventTypes", "typesOfMakeupArtists",
      "onsiteMakeup", "customization", "serviceTypes",
      "photos", "videos", "priceStarts",
      "venId"
    ];

    // ✅ Find missing fields dynamically
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      console.log("Missing Fields:", missingFields); // 🛠️ Log missing fields
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
    }

    const alreadyExists = await MakeupArtist.findOne({
      name: req.body.artistName,
      id: req.body.id,
    });

    if (alreadyExists) {
      return res.status(400).json({ message: "Makeup Artist already exists" });
    }

    const newMakeupArtist = new MakeupArtist({
      basicDetails: {
        artistName: req.body.artistName,
        artistDescription: req.body.artistDescription,
        eventSize: req.body.eventSize,
        eventTypes: req.body.eventTypes.split(","),
        typesOfMakeupArtists: req.body.typesOfMakeupArtists.split(","),
      },
      serviceDetails: {
        onsiteMakeup: req.body.onsiteMakeup === "Yes",
        customization: req.body.customization === "Yes",
        serviceTypes: req.body.serviceTypes.split(","),
      },
      additionalDetails: {
        photos: req.body.photos,
        videos: req.body.videos,
        socialMedia: req.body.socialMedia.split(","),
        websiteUrl: req.body.websiteUrl,
        priceStarts: req.body.priceStarts,
      },
      policies: {
        termsAndConditions: req.body.termsAndConditions ? req.body.termsAndConditions.split(",") : [],
        cancellationPolicy: req.body.cancellationPolicy ? req.body.cancellationPolicy.split(",") : [],
        certificateOrAwards: req.body.certificateOrAwards ? req.body.certificateOrAwards.split(",") : [],
        clientTestimonials: req.body.clientTestimonials ? req.body.clientTestimonials.split(",") : [],
      },
      venId: req.body.venId,
    });

    const savedMakeupArtist = await newMakeupArtist.save();

    // ✅ Find the vendor
    const vendor = await User.findOne({ id: req.body.venId });
    // if (!vendor) {
    //   await MakeupArtist.findOne({ id: savedMakeupArtist.id });
    //   return res.status(404).json({ message: "Vendor not found" });
    // }

    console.log(`The vendor found is ${vendor}`); // 🛠️ Log the vendor

    // ✅ Add the `serId` with the correct `serType`
    vendor.serviceIds.push({
      serType: "makeupArtist",  // Correct service type
      serId: savedMakeupArtist.id,
    });

    await vendor.save();

    res.status(201).json(savedMakeupArtist);

  } catch (error) {
    console.error("Error:", error); // 🛠️ Log error details
    res.status(400).json({ error: error.message });
  }
};


const getAllMakeupArtist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const caterers = await MakeupArtist.find().skip(skip).limit(itemsPerPage);

    const totalCaterers = await MakeupArtist.countDocuments();

    res.status(200).json({
      data: caterers,
      currentPage: page,
      totalPages: Math.ceil(totalCaterers / itemsPerPage),
      totalItems: totalCaterers,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createMakeupArtist, getAllMakeupArtist };
