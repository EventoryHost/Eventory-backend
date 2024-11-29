import { Caterer } from "../../models/caterer.js";

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
      "food_safety_certificates"
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
        priceStartingFrom:req.body.priceStartingFrom,

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

    const savedCaterer = await newCaterer.save();
    // const vendor = await Vendor.findOne({ id: req.body.venId });
    // if (!vendor) {
    //   // If we can't find the vendor, we should probably delete the caterer we just created
    //   await Caterer.findByIdAndDelete(savedCaterer._id);
    //   return res.status(404).json({ message: "Vendor not found" });
    // }

    // // Add the new caterer's ID to the vendor's serviceIds array
    // vendor.serviceIds = [...vendor.serviceIds, savedCaterer.id];
    // await vendor.save();
    console.log(savedCaterer);

    res.status(201).json(savedCaterer);
  } catch (error) {
    console.log(error)
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
