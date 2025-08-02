import DjArtist from "../../models/djArtist.js";
import DjArtistModel from "../../models/reduxStores/djArtist.js";
import { Vendor as User } from "../../models/users.js";
import { sendOnboardingTemplate } from '../waController.js'

const getFileUrls = (files, fieldName) => {
  // Handle cases where there might be a single file instead of an array of files
  const fileArray = files[fieldName];
  if (fileArray) {
    return Array.isArray(fileArray)
      ? fileArray.map((file) => file.location)
      : [fileArray.location];
  }
  return [];
};

const checkCompletion = (section) => {
  if (!section || typeof section !== "object") return false; // Validate input

  return Object.keys(section).every((key) => {
    const value = section[key];
    // Check if the value is an array and not empty
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    // Check if the value is non-empty for other types
    return value !== undefined && value !== null && value !== "";
  });
};

const updateSectionCompletion = async (id) => {
  try {
    const djArtist = await DjArtist.findOne({ id });
    if (!djArtist) throw new Error("Makeup artist not found");

    djArtist.basicDetails.completed = checkCompletion(djArtist.basicDetails);
    djArtist.serviceDetails.completed = checkCompletion(
      djArtist.serviceDetails
    );
    djArtist.additionalDetails.completed = checkCompletion(
      djArtist.additionalDetails
    );
    djArtist.policies.completed = checkCompletion(djArtist.policies);

    await djArtist.save();
  } catch (error) {
    console.error("Error in update section completion:", error);
    throw error;
  }
};

const createDjArtist = async (req, res) => {
  try {
    console.log("Received Data:", req.body);

    const alreadyExists = await DjArtist.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });

    if (alreadyExists) {
      return res.status(400).json({ message: "DJ Artist already exists" });
    }

    const photos = getFileUrls(req.files, "photos");
    const videos = getFileUrls(req.files, "videos");

    const fieldsToCheck = [
      req.body.serviceName,
      req.body.name,
      req.body.contact,
      req.body.description,
      req.body.address,
      req.body.latitude,
      req.body.longitude,
      req.body.serviceAreas?.length > 0,
      req.body.eventTypes?.length > 0,
      req.body.musicGenres?.length > 0,
      req.body.regionalSpecializations?.length > 0,
      req.body.servicesOffered?.length > 0,
      photos.length > 0,
      videos.length > 0,
      req.body.awards,
      req.body.instagramUrl,
      req.body.websiteUrl,
      req.body.testimonials?.length > 0,
      req.body.priceStarts,
      req.body.termsAndConditions?.length > 0,
      req.body.cancellationPolicy?.length > 0,
    ];

    const completedFields = fieldsToCheck.filter(Boolean).length;
    const profileCompletion =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    // Fetch agreement data from temporary DJ artist collection
    const tempDjArtistData = await DjArtistModel.findOne({ id: req.body.venId });
    const agreementUrl = tempDjArtistData?.agreementUrl || null;
    const agreementSignedAt = tempDjArtistData?.agreementSignedAt || null;

    if (agreementUrl) {
      console.log("Found agreement data for DJ artist:", agreementUrl);
    }

    const newDjArtist = new DjArtist({
      basicDetails: {
        profileCompletion,
        serviceName: req.body.serviceName,
        name: req.body.name,
        contact: req.body.contact,
        description: req.body.description,
        address: req.body.address,
        serviceAreas: req.body.serviceAreas || [],
        location: {
          lat: parseFloat(req.body.latitude),
          lng: parseFloat(req.body.longitude),
        },
      },
      serviceDetails: {
        eventTypes: req.body.eventTypes?.split(",") || [],
        musicGenres: req.body.musicGenres?.split(",") || [],
        regionalSpecializations:
          req.body.regionalSpecializations?.split(",") || [],
        servicesOffered: req.body.servicesOffered?.split(",") || [],
      },
      additionalDetails: {
        photos,
        videos,
        awards: req.body.awards,
        instagramUrl: req.body.instagramUrl,
        websiteUrl: req.body.websiteUrl,
        testimonials: req.body.testimonials,
        priceStarts: Number(req.body.priceStarts),
      },
      policies: {
        termsAndConditions: req.body.termsAndConditions?.split(",") || [],
        cancellationPolicy: req.body.cancellationPolicy?.split(",") || [],
        certificateOrAwards: req.body.certificateOrAwards?.split(",") || [],
        clientTestimonials: req.body.clientTestimonials?.split(",") || [],
        agreementUrl: agreementUrl,
        agreementSignedAt: agreementSignedAt,
      },
      venId: req.body.venId,
    });

    const savedDjArtist = await newDjArtist.save();

    const vendor = await User.findOne({ id: req.body.venId });
    if (!vendor) {
      await DjArtist.findByIdAndDelete(savedDjArtist.id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.serviceIds.push({
      serType: "djArtist",
      serId: savedDjArtist.id,
    });

    await vendor.save();

    await updateSectionCompletion(savedDjArtist.id);
    await sendOnboardingTemplate(req.body.name, vendor.phoneNumber);

    return res.status(201).json(savedDjArtist);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};

const getAllDjArtist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;
    const skip = (page - 1) * itemsPerPage;
    const djArtists = await DjArtist.find().skip(skip).limit(itemsPerPage);
    const caterers = await DjArtist.find().skip(skip).limit(itemsPerPage);

    const totalCaterers = await DjArtist.countDocuments();

    res.status(200).json({
      data: caterers,
      currentPage: page,
      totalPages: Math.ceil(totalCaterers / itemsPerPage),
      totalItems: totalCaterers,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

export default { createDjArtist, getAllDjArtist }; // ✅ Proper export
