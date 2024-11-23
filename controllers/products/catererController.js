import { Caterer } from "../../models/caterer.js";

// Function to handle multiple files
const getFileUrls = (files, fieldName) => {
  // Handle cases where there might be a single file instead of an array of files
  const fileArray = files[fieldName];
  if (fileArray) {
    return Array.isArray(fileArray) ? fileArray.map((file) => file.location) : [fileArray.location];
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
    const foodSafetyCertificatesUrls = getFileUrls(req.files, "food_safety_certificates");
    const foodSafetyCertificates = foodSafetyCertificatesUrls.length ? foodSafetyCertificatesUrls : req.body.food_safety_certificates || [];

    // Create new caterer
    const newCaterer = new Caterer({
      managerName: req.body.managerName,
      capacity: req.body.capacity,
      venId: req.body.venId,
      description: req.body.description,
      name: req.body.name,
      cuisine_specialities: req.body.cuisine_specialities,
      regional_specialities: req.body.regional_specialities,
      service_style_offered: req.body.service_style_offered,
      appetizers: req.body.appetizers,
      beverages: req.body.beverages,
      main_course: req.body.main_course,
      special_dietary_options: req.body.special_dietary_options,
      pre_set_menus: req.body.pre_set_menus,
      additional_services: req.body.additional_services,
      event_types_catered: req.body.event_types_catered,
      equipment_provided: req.body.equipment_provided,
      vegOrNonVeg: req.body.vegOrNonVeg,
      menu: menu,
      customizable: req.body.customizable === "true",
      staff_provided: req.body.staff_provided,
      minimum_order_requirements: req.body.minimum_order_requirements,
      advance_booking_period: req.body.advance_booking_period,
      deposit_required: req.body.deposit_required,
      cancellation_policy: cancellationPolicyFileUrl,
      tasting_sessions: req.body.tasting_sessions === "true",
      business_licenses: req.body.business_licenses === "true",
      food_safety_certificates: Array.isArray(foodSafetyCertificates) ? foodSafetyCertificates : [foodSafetyCertificates],
      terms_and_conditions: termsAndConditionsFileUrl,
      photos: Array.isArray(photos) ? photos : [photos],
      videos: Array.isArray(videos) ? videos : [videos],
      client_testimonials: clientTestimonialsUrls,
    });

    const savedCaterer = await newCaterer.save();
    res.status(201).json(savedCaterer);
  } catch (error) {
    // console.log(error)
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
