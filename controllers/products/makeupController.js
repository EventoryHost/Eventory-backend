import MakeupArtist from "../../models/makeupArtists.js";
import { Vendor as User } from "../../models/users.js";
import parseRange from "../../utils/parseRange.js";

const getFileUrls = (files, fieldName) => {
  const fileArray = files[fieldName];
  if (fileArray) {
    return Array.isArray(fileArray)
      ? fileArray.map((file) => file.location)
      : [fileArray.location];
  }
  return [];
};

const checkCompletion = (section) => {
  if (!section || typeof section !== "object") return false;
  return Object.keys(section).every((key) => {
    const value = section[key];
    return Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== null && value !== "";
  });
};

const updateSectionCompletion = async (id) => {
  try {
    const makeupArtist = await MakeupArtist.findOne({ id });
    if (!makeupArtist) throw new Error("Makeup artist not found");

    makeupArtist.basicDetails.completed = checkCompletion(
      makeupArtist.basicDetails,
    );
    makeupArtist.serviceDetails.completed = checkCompletion(
      makeupArtist.serviceDetails,
    );
    makeupArtist.additionalDetails.completed = checkCompletion(
      makeupArtist.additionalDetails,
    );
    makeupArtist.policies.completed = checkCompletion(makeupArtist.policies);

    await makeupArtist.save();
  } catch (error) {
    console.error("Error in update section completion:", error);
    throw error;
  }
};

const createMakeupArtist = async (req, res) => {
  try {
    // Check if artist already exists
    const alreadyExists = await MakeupArtist.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Makeup artist already exists" });
    }

    // Get uploaded file URLs
    // const photos = getFileUrls(req.files, "photos");
    // const videos = getFileUrls(req.files, "videos");

    // Parse location data
    const location = {
      lat: parseFloat(req.body.lat),
      lng: parseFloat(req.body.lng),
      pincode: parseInt(req.body.pincode),
      googleMapsAddress: req.body.googleMapsAddress || ""
    };

    // Parse event size range
    const eventSize = parseRange(req.body.eventSize);

    const newMakeupArtist = new MakeupArtist({
      type: "makeupArtist",
      isVerified: false,
      rating: 0,
      vendorType: "makeupArtist",

      basicDetails: {
        name: req.body.name,
        description: req.body.description,
        eventSize: {
          ll: eventSize.ll,
          ul: eventSize.ul
        },
        eventTypes: req.body.eventTypes.split(","),
        typesOfMakeupArtists: req.body.typesOfMakeupArtists.split(","),
        address: req.body.address,
        location: location,
        profileCompletion: 0 // Will be updated after creation
      },

      serviceDetails: {
        onsiteMakeup: req.body.onsiteMakeup === "Yes",
        customization: req.body.customization === "Yes",
        serviceTypes: req.body.serviceTypes.split(",")
      },

      additionalDetails: {
        photos: req.body.photos,
        videos: req.body.videos,
        socialMedia: req.body.socialMedia || "",
        websiteUrl: req.body.websiteUrl || "",
        priceStartingFrom: req.body.priceStarts
      },

      policies: {
        termsAndConditions: req.body.termsAndConditions
          ? req.body.termsAndConditions.split(",")
          : [],
        cancellationPolicy: req.body.cancellationPolicy
          ? req.body.cancellationPolicy.split(",")
          : [],
        certificateOrAwards: req.body.certificateOrAwards
          ? req.body.certificateOrAwards.split(",")
          : [],
        clientTestimonials: req.body.clientTestimonials
          ? req.body.clientTestimonials.split(",")
          : []
      },

      venId: req.body.venId
    });

    const savedMakeupArtist = await newMakeupArtist.save();

    // Find and update the vendor
    const vendor = await User.findOne({ id: req.body.venId });
    if (vendor) {
      vendor.serviceIds.push({
        serType: "makeupArtist",
        serId: savedMakeupArtist.id
      });
      await vendor.save();
    }

    // Update section completion and profile completion
    await updateSectionCompletion(savedMakeupArtist.id);

    res.status(201).json(savedMakeupArtist);
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({ error: error.message });
  }
};

const getAllMakeupArtist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;
    const skip = (page - 1) * itemsPerPage;

    const makeupArtists =
      page == -1
        ? await MakeupArtist.find()
        : await MakeupArtist.find().skip(skip).limit(itemsPerPage);

    const totalMakeupArtists = await MakeupArtist.countDocuments();

    res.status(200).json({
      data: makeupArtists,
      currentPage: page,
      totalPages: Math.ceil(totalMakeupArtists / itemsPerPage),
      totalItems: totalMakeupArtists,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createMakeupArtist, getAllMakeupArtist };