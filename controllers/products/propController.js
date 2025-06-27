import PropRental from "../../models/props.js";
import propRental from "../../models/props.js";
import { Vendor as User } from "../../models/users.js";
import { sendEmailToSlack } from "../sesController.js";


// Helper function to handle multiple files
const getFileUrls = (files, fieldName) => {
  const fileArray = files[fieldName];
  if (fileArray) {
    return Array.isArray(fileArray)
      ? fileArray.map((file) => file.location)
      : [fileArray.location];
  }
  return [];
};

// Function to check section completion
const checkCompletion = (section) => {
  if (!section) return false;

  // Check that all required fields are filled, including non-empty arrays
  const requiredFields = Object.keys(section).filter((key) => {
    // Ensure that the array is not empty and that the field is not null or undefined
    if (Array.isArray(section[key])) {
      return section[key].length > 0; // Check that the array is not empty
    }
    return (
      section[key] !== undefined && section[key] !== null && section[key] !== ""
    );
  });

  // Return true if all required fields are filled
  return requiredFields.length === Object.keys(section).length;
};

// Function to update the section completion status
const updateSectionCompletion = async (propId) => {
  try {
    const prop = await propRental.findOne({ id: propId });

    if (!prop) {
      throw new Error("Prop rental not found");
    }

    // Ensure each section exists before checking completion
    prop.basicDetails.completed = checkCompletion(prop.basicDetails || {});
    prop.serviceDetails.completed = checkCompletion(prop.serviceDetails || {});
    prop.additionalDetails.completed = checkCompletion(
      prop.additionalDetails || {},
    );
    prop.furnitureAndDecor.completed = checkCompletion(
      prop.furnitureAndDecor || {},
    );
    prop.tentAndCanopy.completed = checkCompletion(prop.tentAndCanopy || {});
    prop.audioVisual.completed = checkCompletion(prop.audioVisual || {});
    prop.policies.completed = checkCompletion(prop.policies || {});

    await prop.save();
  } catch (error) {
    console.error("Error in update section:", error);
    throw error;
  }
};

// Profile completion calculation
const calculateProfileCompletion = (basicDetails) => {
  const fields = ["managerName", "description", "eventSize"];
  const filledFields = fields.filter(
    (field) => basicDetails[field] && basicDetails[field].trim() !== "",
  );
  return Math.round((filledFields.length / fields.length) * 100);
};

const createProp = async (req, res) => {
  try {
    const furnitureAndDecorListUrl = req.body.furnitureAndDecorList || [];

    const tentAndCanopyListUrl = req.body.tentAndCanopyList || [];

    const audioVisualListUrl = req.body.audioVisualList || [];

    const termsAndConditionsUrl = req.body.termsAndConditions || [];

    const cancellationPolicyUrl = req.body.cancellationPolicy || [];

    const itemCatalogueFile = req.files?.itemCatalogue?.[0];
    const itemCatalogueUrl = itemCatalogueFile
      ? itemCatalogueFile.location
      : req.body.itemCatalogue === "true"
        ? "true"
        : "false";

    const photosUrl = req.body.photos || [];

    const videosUrl = req.body.videos || [];

    const basicDetails = {
      managerName: req.body.managerName,
      description: req.body.descriptionOfWork,
      eventSize: req.body.eventSize,
    };

    const profileCompletion = calculateProfileCompletion(basicDetails);

    const newProp = new propRental({
      basicDetails: {
        ...basicDetails,
        profileCompletion,
      },
      serviceDetails: {
        itemCatalogue: itemCatalogueUrl,
        customization: req.body.customization === "true",
        maintenance: req.body.maintenance,
        services: req.body.services,
        serviceProvided: req.body.serviceProvided,
      },
      additionalDetails: {
        photos: Array.isArray(photosUrl) ? photosUrl : [photosUrl],
        videos: Array.isArray(videosUrl) ? videosUrl : [videosUrl],
        awardsAndRecognize: req.body.awardsAndRecognize,
        clientTestimonial: req.body.clientTestimonial,
        instaUrl: req.body.instaUrl,
        websiteUrl: req.body.websiteUrl,
        priceStartingFrom: req.body.priceStartingFrom,
      },
      ...req.body,
      furnitureAndDecor: {
        listUrl: furnitureAndDecorListUrl,
        ...req.body.furnitureAndDecor,
      },
      tentAndCanopy: {
        listUrl: tentAndCanopyListUrl,
        ...req.body.tentAndCanopy,
      },
      audioVisual: {
        listUrl: audioVisualListUrl,
        ...req.body.audioVisual,
      },
      policies: {
        termsAndConditions: termsAndConditionsUrl,
        cancellationPolicy: cancellationPolicyUrl,
      },
    });

    const savedProp = await newProp.save();
    const vendor = await User.findOne({ id: req.body.venId });
    if (!vendor) {
      await propRental.findByIdAndDelete(savedProp.id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.serviceIds.push({
      serType: "prop-rental",
      serId: savedProp.id,
    });
    await vendor.save();

    // Update section completion for prop rental
    await updateSectionCompletion(savedProp.id);
    process.env.IS_DEV !== "true" && sendEmailToSlack({
      name: savedProp.basicDetails.name,
      type: savedProp.type,
    })
    res.status(201).json(savedProp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllProp = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const caterers = await PropRental.find().skip(skip).limit(itemsPerPage);

    const totalCaterers = await PropRental.countDocuments();

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

export default { createProp, getAllProp };
