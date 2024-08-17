import { Caterer } from "../../models/caterer.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
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

    const menuFileUrl = getFileUrls(req.files, "menu")[0] || req.body.menu;
    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellation_policy")[0] ||
      req.body.cancellation_policy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "terms_and_conditions")[0] ||
      req.body.terms_and_conditions;
    const portfolioUrls = getFileUrls(req.files, "portfolio");

    const newCaterer = new Caterer({
      managerName: req.body.managerName,

      venId: req.body.venId,
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
      rates: {
        hourly: {
          type: req.body.rates.hourly.type,
          priceRange: req.body.rates.hourly.priceRange,
        },
        daily: {
          type: req.body.rates.daily.type,
          priceRange: req.body.rates.daily.priceRange,
        },
        seasonal: {
          type: req.body.rates.seasonal.type,
          priceRange: req.body.rates.seasonal.priceRange,
        },
      },
      menu: menuFileUrl,
      menuType: req.body.menuType,
      customizable: req.body.customizable,
      staff_provided: req.body.staff_provided,
      minimum_order_requirements: req.body.minimum_order_requirements,
      advance_booking_period: req.body.advance_booking_period,
      deposit_required: req.body.deposit_required,
      per_plate_rates: req.body.per_plate_rates,
      package_deals: req.body.package_deals,
      per_plate_price_range: req.body.per_plate_price_range,
      cancellation_policy: cancellationPolicyFileUrl,
      tasting_sessions: req.body.tasting_sessions === "true",
      business_licenses: req.body.business_licenses === "true",
      food_safety_certificates: req.body.food_safety_certificates === "true",
      terms_and_conditions: termsAndConditionsFileUrl,
      portfolio: portfolioUrls,
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
