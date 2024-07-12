import Caterer from "../../models/caterer.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createCaterer = async (req, res) => {
  try {
    const alreadyExists = await Caterer.findOne({
      name: req.body.name,
      id: req.body.id,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Caterer already exists" });
    }

    const menuFileUrl = getFileUrls(req.files, "menu")[0] || req.body.menu;
    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellation_policy")[0] || req.body.cancellation_policy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "terms_and_conditions")[0] || req.body.terms_and_conditions;
    const cateringServiceImagesUrls = getFileUrls(
      req.files,
      "catering_service_images"
    );
    const videosOfEventSetupsUrls = getFileUrls(
      req.files,
      "videos_of_event_setups"
    );

    const newCaterer = new Caterer({
      name: req.body.name,
      id: req.body.id,
      cuisine_specialities: req.body.cuisine_specialities,
      regional_specialities: req.body.regional_specialities,
      service_style_offered: req.body.service_style_offered,
      menu: {
        type: req.body.menuType,
        file: menuFileUrl,
      },
      appetizers: req.body.appetizers,
      main_course: req.body.main_course,
      beverages: req.body.beverages,
      special_dietary_options: req.body.special_dietary_options,
      pre_set_menus: req.body.pre_set_menus,
      customizable: req.body.customizable,
      event_types_catered: req.body.event_types_catered,
      additional_services: req.body.additional_services,
      staff_provided: req.body.staff_provided,
      equipment_provided: req.body.equipment_provided,
      minimum_order_requirements: req.body.minimum_order_requirements,
      advance_booking_period: req.body.advance_booking_period,
      deposit_required: req.body.deposit_required,
      per_plate_rates: req.body.per_plate_rates,
      package_deals: req.body.package_deals,
      per_plate_price_range: req.body.per_plate_price_range,
      cancellation_policy: {
        file: cancellationPolicyFileUrl,
        via: req.body.cancellationPolicyVia,
      },
      tasting_sessions: req.body.tasting_sessions,
      business_licenses: req.body.business_licenses,
      food_safety_certificates: req.body.food_safety_certificates,
      terms_and_conditions: {
        file: termsAndConditionsFileUrl,
        via: req.body.termsAndConditionsVia,
      },
      catering_service_images: cateringServiceImagesUrls,
      videos_of_event_setups: videosOfEventSetupsUrls,
    });

    const savedCaterer = await newCaterer.save();
    res.status(201).json(savedCaterer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllCaterers = async (req, res) => {
  try {
    const caterers = await res.json(caterers);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createCaterer, getAllCaterers };
