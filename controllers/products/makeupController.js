import MakeupArtist from "../../models/makeupArtists.js";
import { Vendor as User } from "../../models/users.js";

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
    // ✅ Check if artist already exists
    const alreadyExists = await MakeupArtist.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Makeup artist already exists" });
    }

    // ✅ Get uploaded file URLs
    const photos = getFileUrls(req.files, "photos");
    const videos = getFileUrls(req.files, "videos");

    // ✅ Define fields for completion check
    const fieldsToCheck = [
      req.body.name,
      req.body.description,
      req.body.eventSize,
      req.body.eventTypes?.length > 0,
      req.body.typesOfMakeupArtists?.length > 0,
      req.body.onsiteMakeup,
      req.body.customization,
      req.body.serviceTypes?.length > 0,
      req.body.priceStarts,
      req.body.socialMedia?.length > 0,
      req.body.websiteUrl,
      req.body.termsAndConditions?.length > 0,
      req.body.cancellationPolicy?.length > 0,
      req.body.certificateOrAwards?.length > 0,
      req.body.clientTestimonials?.length > 0,
      photos.length > 0,
      videos.length > 0,
    ];
    const completedFields = fieldsToCheck.filter(Boolean).length;
    const profileCompletion =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    const newMakeupArtist = new MakeupArtist({
      basicDetails: {
        name: req.body.name,
        description: req.body.description,
        eventSize: req.body.eventSize,
        eventTypes: req.body.eventTypes.split(","),
        typesOfMakeupArtists: req.body.typesOfMakeupArtists.split(","),
        profileCompletion,
      },
      serviceDetails: {
        onsiteMakeup: req.body.onsiteMakeup === "Yes",
        customization: req.body.customization === "Yes",
        serviceTypes: req.body.serviceTypes.split(","),
      },
      additionalDetails: {
        photos,
        videos,
        socialMedia: req.body.socialMedia,
        websiteUrl: req.body.websiteUrl,
        priceStarts: req.body.priceStarts,
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
          : [],
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

    // console.log(`The vendor found is ${vendor}`); // 🛠️ Log the vendor

    // ✅ Add the `serId` with the correct `serType`
    if (vendor) {
      vendor.serviceIds.push({
        serType: "makeupArtist", // Correct service type
        serId: savedMakeupArtist.id,
      });

      await vendor.save();
    }
    // ✅ Update section completion
    await updateSectionCompletion(savedMakeupArtist.id);

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

    const makeupArtists = await MakeupArtist.find()
      .skip(skip)
      .limit(itemsPerPage);

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
