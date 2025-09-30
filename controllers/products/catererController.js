import { Caterer } from "../../models/caterer.js";
import { CateringModel } from "../../models/reduxStores/catering.js";
import { Vendor as User } from "../../models/users.js";
import calculateProfileCompletion from "../../utils/calculateCompletion.js";
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
    //ser1: Ankit caterer
    //ser2: ankit caterer
    const alreadyExists = await Caterer.findOne({
      name: req.body.name,
      id: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Caterer already exists" });
    }

    const cancellationPolicyFileUrl = req.body.cancellation_policy || "";
    const termsAndConditionsFileUrl = req.body.terms_and_conditions || "";
    const clientTestimonialsUrl = req.body.client_testimonials_url || "";

    // Handle file uploads and array conversions
    const menu = req.body.menu || [];
    let photos = req.body.photos || [];
    let videos = req.body.videos || [];
    const foodSafetyCertificates = req.body.food_safety_certificates || []; // 🔹 FIXED: Defined foodSafetyCertificates

    if (Array.isArray(photos)) {
      photos = photos.map(item => {
        if (typeof item === 'string') {
          try {
            const parsed = JSON.parse(item);
            if (parsed.original || parsed.preview) {
              return parsed;
            }
            return item; 
          } catch (e) {
            return item;
          }
        }
        return item; 
      });
    } else if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        photos = [parsed];
      } catch (e) {
        photos = [photos];
      }
    }

    // Normalize videos to an array of plain string URLs
    if (Array.isArray(videos)) {
      videos = videos.map(item => (typeof item === 'string' ? item : String(item))).filter(Boolean);
    } else if (typeof videos === 'string') {
      if (videos.startsWith('[')) {
        try {
          const arr = JSON.parse(videos);
          videos = Array.isArray(arr) ? arr.map(item => (typeof item === 'string' ? item : String(item))).filter(Boolean) : [];
        } catch (e) {
          videos = videos.includes(',') ? videos.split(',').map(url => url.trim()).filter(Boolean) : [videos];
        }
      } else if (videos.includes(',')) {
        videos = videos.split(',').map(url => url.trim()).filter(Boolean);
      } else {
        videos = [videos];
      }
    }
    const fieldsToCheck = [
      req.body.name,
      req.body.managerName,
      req.body.capacity,
      req.body.description,
      req.body.address,
      req.body.latitude,
      req.body.longitude,
      req.body.serviceAreas?.length > 0,
      req.body.cuisine_specialities?.length > 0,
      req.body.regional_specialities?.length > 0,
      req.body.service_style_offered,
      req.body.vegOrNonVeg,
      menu.length > 0 ||
      (req.body.appetizers?.length > 0 &&
        req.body.beverages?.length > 0 &&
        req.body.main_course?.length > 0),
      req.body.special_dietary_options?.length > 0,
      req.body.customizable,
      req.body.additional_services?.length > 0,
      req.body.event_types_catered?.length > 0,
      req.body.equipment_provided?.length > 0,
      req.body.staff_provided?.length > 0,
      req.body.priceStartingFrom,
      req.body.minimum_order_requirements,
      req.body.advance_booking_period,
      req.body.tasting_sessions,
      req.body.business_licenses,
      foodSafetyCertificates.length > 0,
      photos.length > 0,
      videos.length > 0,
      cancellationPolicyFileUrl,
      termsAndConditionsFileUrl,
    ];

    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profileCompletion =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    let agreementUrl = null;
    let agreementSignedAt = null;
    
    try {
      const tempCateringData = await CateringModel.findOne({ id: req.body.venId });
      if (tempCateringData && tempCateringData.agreementUrl) {
        agreementUrl = tempCateringData.agreementUrl;
        agreementSignedAt = tempCateringData.agreementSignedAt;
        console.log("Found agreement data in temp catering:", {
          agreementUrl,
          agreementSignedAt
        });
      }
    } catch (tempDataError) {
      console.warn("Could not fetch agreement data from temporary catering:", tempDataError.message);
    }

    // Create new caterer document
    const newCaterer = new Caterer({
      basicDetails: {
        managerName: req.body.managerName,
        capacity: parseRange(req.body.capacity),
        name: req.body.name,
        description: req.body.description,
        cuisine_specialities: req.body.cuisine_specialities,
        serviceAreas: req.body.serviceAreas,
        regional_specialities: req.body.regional_specialities,
        service_style_offered: req.body.service_style_offered,
        // address: req.body.address,
        // latitude: req.body.latitude,
        // longitude: req.body.longitude,
        profileCompletion,
        location: {
          lat: req.body.latitude, // Latitude
          lng: req.body.longitude, // Longitude
          googleMapsAddress: req.body.address, // Google Maps address
          pincode: req.body.pincode,
        },
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
        priceStartingFrom: parseInt(req.body.priceStartingFrom, 10) || 0,
        minimum_order_requirements: req.body.minimum_order_requirements,
        advance_booking_period: parseRange(req.body.advance_booking_period),
        photos: Array.isArray(photos) ? photos.map(url => {
          // If it's already an object with original and preview, use it directly
          if (typeof url === 'object' && url.original && url.preview) {
            return {
              original: url.original,
              preview: url.preview
            };
          }
          // If it's just an object with original, generate preview
          if (typeof url === 'object' && url.original) {
            let previewUrl = url.original;
            if (url.original.includes('/original-')) {
              previewUrl = url.original.replace('/original-', '/preview-');
              // For images, change extension to .webp
              if (url.original.match(/\.(jpg|jpeg|png|gif)$/i)) {
                previewUrl = previewUrl.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
              }
            }
            return {
              original: url.original,
              preview: previewUrl
            };
          }
          // If it's a string, generate both original and preview
          if (typeof url === 'string') {
            let previewUrl = url;
            if (url.includes('/original-')) {
              previewUrl = url.replace('/original-', '/preview-');
              // For images, change extension to .webp
              if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                previewUrl = previewUrl.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
              }
            }
            return { original: url, preview: previewUrl };
          }
          return { original: url, preview: url };
        }) : [],
        videos: Array.isArray(videos) ? videos.filter(url => typeof url === 'string' && url.length > 0) : [],
        tasting_sessions: req.body.tasting_sessions === "true",
        business_licenses: req.body.business_licenses === "true",
        food_safety_certificates: Array.isArray(foodSafetyCertificates)
          ? foodSafetyCertificates
          : [foodSafetyCertificates], // 🔹 FIXED: Ensured it's an array
      },
      policies: {
        cancellationPolicy: cancellationPolicyFileUrl,
        termsAndConditions: termsAndConditionsFileUrl,
        client_testimonials: clientTestimonialsUrl,
        agreementUrl: agreementUrl,
        agreementSignedAt: agreementSignedAt,
      },
    });


    const savedCaterer = await newCaterer.save();

    // Update section completion and profile completion
    await updateSectionCompletion(savedCaterer.id);

    // Associate with vendor
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
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const getAllCaterers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const caterers = await Caterer.find().skip(skip).limit(itemsPerPage);

    const totalCaterers = await Caterer.countDocuments();

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

const getCatererById = async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ id: req.params.id });
    if (!caterer) {
      return res.status(404).json({ message: "Caterer not found" });
    }
    res.status(200).json(caterer);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};


export default { createCaterer, getAllCaterers , getCatererById };
