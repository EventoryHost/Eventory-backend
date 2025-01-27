import { Caterer } from "../../models/caterer.js";
import { Vendor as User } from "../../models/users.js";
import calculateProfileCompletion from "../../utils/calculateCompletion.js";

// Function to handle multiple files
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

// Function to update the section completion status
const updateSectionCompletion = async (venId) => {
  try {
    const caterer = await Caterer.findOne({
      id: venId,
    });

    // Ensure caterer exists before accessing its fields
    if (!caterer) {
      throw new Error("Caterer not found");
    }

    // Ensure each section exists before checking completion
    caterer.basicDetails.completed = checkCompletion(
      caterer.basicDetails || {},
    );
    caterer.menuDetails.completed = checkCompletion(caterer.menuDetails || {});
    caterer.eventDetails.completed = checkCompletion(
      caterer.eventDetails || {},
    );
    caterer.staffAndEquipmentDetails.completed = checkCompletion(
      caterer.staffAndEquipmentDetails || {},
    );
    caterer.additionalDetails.completed = checkCompletion(
      caterer.additionalDetails || {},
    );
    caterer.policies.completed = checkCompletion(caterer.policies || {});

    await caterer.save();
  } catch (error) {
    console.error("Error in update section:", error);
    throw error;
  }
};

const createCaterer = async (req, res) => {
  try {
    const alreadyExists = await Caterer.findOne({
      name: req.body.name,
      id: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Caterer already exists" });
    }

    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellation_policy")[0] ||
      req.body.cancellation_policy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "terms_and_conditions")[0] ||
      req.body.terms_and_conditions;

    // Handle file URLs (for both single and multiple files)

    const menuFileUrl = getFileUrls(req.files, "menu");
    const menu = menuFileUrl.length ? menuFileUrl : req.body.menu || [];

    const photosUrls = getFileUrls(req.files, "photos");
    const photos = photosUrls.length ? photosUrls : req.body.photos || [];

    const videosUrls = getFileUrls(req.files, "videos");
    const videos = videosUrls.length ? videosUrls : req.body.videos || [];

    const clientTestimonialsUrls =
      getFileUrls(req.files, "client_testimonials")[0] ||
      req.body.client_testimonials;

    // Handle food safety certificates (multiple or single)
    const foodSafetyCertificatesUrls = getFileUrls(
      req.files,
      "food_safety_certificates",
    );
    const foodSafetyCertificates = foodSafetyCertificatesUrls.length
      ? foodSafetyCertificatesUrls
      : req.body.food_safety_certificates || [];

    // Create new caterer
    const newCaterer = new Caterer({
      basicDetails: {
        managerName: req.body.managerName,
        capacity: req.body.capacity,
        name: req.body.name,
        description: req.body.description,
        cuisine_specialities: req.body.cuisine_specialities,
        regional_specialities: req.body.regional_specialities,
        service_style_offered: req.body.service_style_offered,
        profileCompletion,
      },
      venId: req.body.venId,
      menuDetails: {
        vegOrNonVeg: req.body.vegOrNonVeg,
        menu: Array.isArray(menu) ? menu : [menu],
        appetizers: req.body.appetizers,
        beverages: req.body.beverages,
        main_course: req.body.main_course,
        special_dietary_options: req.body.special_dietary_options,
        pre_set_menus: req.body.pre_set_menus,
        customizable: req.body.customizable === "true",
      },
      eventDetails: {
        additional_services: req.body.additional_services,
        event_types_catered: req.body.event_types_catered,
      },
      staffAndEquipmentDetails: {
        equipment_provided: req.body.equipment_provided,

        staff_provided: req.body.staff_provided,
      },
      additionalDetails: {
        priceStartingFrom: req.body.priceStartingFrom,
        minimum_order_requirements: req.body.minimum_order_requirements,
        advance_booking_period: req.body.advance_booking_period,
        photos: Array.isArray(photos) ? photos : [photos],
        videos: Array.isArray(videos) ? videos : [videos],
        tasting_sessions: req.body.tasting_sessions === "true",
        business_licenses: req.body.business_licenses === "true",
        food_safety_certificates: Array.isArray(foodSafetyCertificates)
          ? foodSafetyCertificates
          : [foodSafetyCertificates],
      },
      policies: {
        cancellation_policy: cancellationPolicyFileUrl,
        terms_and_conditions: termsAndConditionsFileUrl,
        client_testimonials: clientTestimonialsUrls,
      },
      // deposit_required: req.body.deposit_required,
    });

    const fieldsToCheck = [
      req.body.name,
      req.body.managerName,
      req.body.capacity,
      req.body.description,
      req.body.cuisine_specialities?.length > 0, // Ensure there's at least one cuisine specialty
      req.body.regional_specialities?.length > 0, // Ensure there's at least one regional specialty
      req.body.service_style_offered,
      req.body.vegOrNonVeg,
      // Check if menu file is provided or if all relevant fields (appetizers, beverages, main_course) are provided
      (menuFileUrl.length > 0 || (
        req.body.appetizers?.length > 0 &&
        req.body.beverages?.length > 0 &&
        req.body.main_course?.length > 0
      )),
      req.body.special_dietary_options?.length > 0, // Ensure there are dietary options
      req.body.pre_set_menus?.length > 0, // Ensure pre-set menus exist
      req.body.customizable === "true", // Ensure customizable option is properly set
      req.body.additional_services?.length > 0, // Ensure additional services are listed
      req.body.event_types_catered?.length > 0, // Ensure event types catered to are specified
      req.body.equipment_provided?.length > 0, // Ensure equipment is provided
      req.body.staff_provided?.length > 0, // Ensure staff is provided
      req.body.priceStartingFrom,
      req.body.minimum_order_requirements,
      req.body.advance_booking_period,
      req.body.tasting_sessions === "true", // Check if tasting sessions are offered
      req.body.business_licenses === "true", // Check if business licenses are valid
      foodSafetyCertificates.length > 0, // Ensure at least one food safety certificate
      photosUrls.length > 0, // At least one photo
      videosUrls.length > 0, // At least one video
      cancellationPolicyFileUrl, // Ensure cancellation policy is uploaded
      termsAndConditionsFileUrl, // Ensure terms and conditions file is uploaded
      clientTestimonialsUrls, // Ensure client testimonials are uploaded
    ];
    
    
    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profileCompletion = 
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    
    const savedCaterer = await newCaterer.save();

    // Update section completion and profile completion
    await updateSectionCompletion(savedCaterer.id);

    const vendor = await User.findOne({ id: req.body.venId });
    if (!vendor) {
      await Caterer.findByIdAndDelete(savedCaterer.id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.serviceIds.push({
      serType: "caterer",
      serId: savedCaterer.id,
    });
    await vendor.save();

    res.status(201).json(savedCaterer);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const getAllCaterers = async (req, res) => {
  try {
    const caterers = await Caterer.find();
    res.status(200).json(caterers);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createCaterer, getAllCaterers };
