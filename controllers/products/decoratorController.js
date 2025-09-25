import { set } from "mongoose";
import { Decorator } from "../../models/decoraters.js";
import { DecoratorModel } from "../../models/reduxStores/decorator.js";
import { Vendor as User } from "../../models/users.js";
import parseRange from "../../utils/parseRange.js";

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
    const decorator = await Decorator.findOne({ id });

    if (!decorator) {
      throw new Error("Decorator not found");
    }

    decorator.basicDetails.completed = checkCompletion(
      decorator.basicDetails || {},
    );
    decorator.themesOffered.completed = checkCompletion(
      decorator.themesOffered || {},
    );
    decorator.themesElement.completed = checkCompletion(
      decorator.themesElement || {},
    );
    decorator.additionalDetails.completed = checkCompletion(
      decorator.additionalDetails || {},
    );
    decorator.policies.completed = checkCompletion(decorator.policies || {});

    await decorator.save();
  } catch (error) {
    console.error("Error in update section completion:", error);
    throw error;
  }
};

const createDecorator = async (req, res) => {
  try {
    const alreadyExists = await Decorator.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Decorator already exists" });
    }

    const insuranceFileUrl = req.body.insurance || [];
    const privacyPolicyFileUrl = req.body.privacyPolicy || [];

    const cancellationPolicyFileUrl = req.body.cancellationPolicy || "";
    const termsAndConditionsFileUrl = req.body.termsAndConditions || "";

    // Check both camelCase and lowercase versions to ensure compatibility
    let themePhotosUrl = req.body.themePhotos || req.body.themephotos || [];
    let themeVideosUrl = req.body.themeVideos || req.body.themevideos || [];
    let photosUrl = req.body.photos || [];
    let videosUrl = req.body.videos || [];

    // Process themePhotos - handle JSON strings from frontend
    if (Array.isArray(themePhotosUrl)) {
      themePhotosUrl = themePhotosUrl.map(item => {
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
    } else if (typeof themePhotosUrl === 'string') {
      try {
        const parsed = JSON.parse(themePhotosUrl);
        themePhotosUrl = [parsed];
      } catch (e) {
        themePhotosUrl = [themePhotosUrl];
      }
    }

    // Process themeVideos - handle JSON strings from frontend
    if (Array.isArray(themeVideosUrl)) {
      themeVideosUrl = themeVideosUrl.filter(item => typeof item === 'string' && item.length > 0);
    } else if (typeof themeVideosUrl === 'string') {
      try {
        const arr = JSON.parse(themeVideosUrl);
        themeVideosUrl = Array.isArray(arr) ? arr.filter(item => typeof item === 'string' && item.length > 0) : [];
      } catch (e) {
        themeVideosUrl = [themeVideosUrl];
      }
    }

    // Process photos - handle JSON strings from frontend
    if (Array.isArray(photosUrl)) {
      photosUrl = photosUrl.map(item => {
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
    } else if (typeof photosUrl === 'string') {
      try {
        const parsed = JSON.parse(photosUrl);
        photosUrl = [parsed];
      } catch (e) {
        photosUrl = [photosUrl];
      }
    }

    // Process videos - handle JSON strings from frontend
    if (Array.isArray(videosUrl)) {
      videosUrl = videosUrl.filter(item => typeof item === 'string' && item.length > 0);
    } else if (typeof videosUrl === 'string') {
      try {
        const arr = JSON.parse(videosUrl);
        videosUrl = Array.isArray(arr) ? arr.filter(item => typeof item === 'string' && item.length > 0) : [];
      } catch (e) {
        videosUrl = [videosUrl];
      }
    }
    const eventTypes = {
      types: req.body.typesOfEvents || [],
      wedding: req.body.weddingEvents || [],
      corporate: req.body.corporateEvents || [],
      seasonal: req.body.seasonalEvents || [],
      cultural: req.body.culturalEvents || [],
    };

    // Calculate profile completion
    const fieldsToCheck = [
      req.body.name,
      req.body.description,
      req.body.address,
      req.body.latitude,
      req.body.longitude,
      req.body.eventSize, // Check if eventSize.ul exists
      req.body.duration,
      req.body.corporateEvents?.length > 0, // Check if at least one event type exists
      req.body.culturalEvents?.length > 0, // Check if at least one event type exists
      req.body.themesOffered?.length > 0, // Check if at least one theme is offered
      req.body.themeElements?.length > 0, // Check if at least one theme element exists
      req.body.colorSchemeAssistance,
      req.body.venueAdaptability,
      req.body.propSelection,
      req.body.customizationsThemes,
      req.body.clientTestimonials,
      req.body.websiteurl,
      req.body.intstagramurl,
      req.body.advanceBookingPeriod,
      req.body.priceStartingFrom,
      req.body.themeProposels,
      req.body.proposalRevisions,
      cancellationPolicyFileUrl,
      termsAndConditionsFileUrl,
      themePhotosUrl.length > 0, // At least one photo
      photosUrl.length > 0, // At least one additional photo
      videosUrl.length > 0, // At least one additional video
    ];
    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profileCompletion =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;
    const eventSize = parseRange(req.body.eventSize);
    console.log("decorator:", req.body);
    
    // Fetch agreement data from temporary decorator collection
    const tempDecoratorData = await DecoratorModel.findOne({ id: req.body.venId });
    const agreementUrl = tempDecoratorData?.agreementUrl || null;
    const agreementSignedAt = tempDecoratorData?.agreementSignedAt || null;
    
    if (agreementUrl) {
      console.log("Found agreement data for decorator:", agreementUrl);
    }
    
    const newDecorator = new Decorator({
      basicDetails: {
        name: req.body.name,
        description: req.body.description,
        eventSize,
        serviceAreas: req.body.serviceAreas || [],
        eventTypes: {
          types: req.body.typesOfEvents || [],
          wedding: req.body.weddingEvents || [],
          corporate: req.body.corporateEvents || [],
          seasonal: req.body.seasonalEvents || [],
          cultural: req.body.culturalEvents || [],
        },
        duration: req.body.duration,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        profileCompletion,
        location: {
          lat: req.body.latitude, // Latitude
          lng: req.body.longitude, // Longitude
          googleMapsAddress: req.body.address, // Google Maps address
          pincode: req.body.pincode, // Pincode
        },
      },
      themesOffered: {
        themesOffered: req.body.themesOffered,
        customDesignProcess: req.body.customDesignProcess,
        propSelection: req.body.propthemesOffered,
        colorSchemeAssistance: req.body.colorschmes,
        themeCustomization: req.body.customizationsThemes,
        venueAdaptability: req.body.adobtThemes,
      },
      themesElement: {
        themeElements: req.body.themeElements,
        themePhotos: Array.isArray(themePhotosUrl)
          ? themePhotosUrl.map(url => {
              if (typeof url === 'object' && url.original && url.preview) {
                return url;
              }
              if (typeof url === 'string') {
                // keep photo objects for schema that expects objects
                let previewUrl = url;
                if (url.includes('original-') && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png'))) {
                  previewUrl = url.replace('original-', 'preview-').replace(/\.(jpg|jpeg|png)$/i, '.webp');
                }
                return { original: url, preview: previewUrl };
              }
              return url;
            })
          : themePhotosUrl ? [{ original: themePhotosUrl, preview: themePhotosUrl }] : [],
        // themeVideos must be an array of plain string URLs per schema. Normalize inputs to string array.
        themeVideos: Array.isArray(themeVideosUrl)
          ? themeVideosUrl.map(v => (typeof v === 'string' ? v : (v && v.original ? v.original : ''))).filter(Boolean)
          : (typeof themeVideosUrl === 'string' ? (themeVideosUrl ? [themeVideosUrl] : []) : []),
      },
      additionalDetails: {
        photos: Array.isArray(photosUrl)
          ? photosUrl.map(url => {
              if (typeof url === 'object' && url.original && url.preview) {
                return url;
              }
              if (typeof url === 'string') {
                let previewUrl = url;
                if (url.includes('original-') && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png'))) {
                  previewUrl = url.replace('original-', 'preview-').replace(/\.(jpg|jpeg|png)$/i, '.webp');
                }
                return { original: url, preview: previewUrl };
              }
              return url;
            })
          : photosUrl ? [{ original: photosUrl, preview: photosUrl }] : [],
        // videos must be stored as plain strings per schema. Normalize to string array.
        videos: Array.isArray(videosUrl) ? videosUrl.map(v => (typeof v === 'string' ? v : (v && v.original ? v.original : ''))).filter(Boolean) : (typeof videosUrl === 'string' ? (videosUrl ? [videosUrl] : []) : []),
        clientTestimonials: req.body.clientTestimonials,
        awards: req.body.awards,
        website: req.body.websiteurl,
        instagram: req.body.intstagramurl,
        advanceBookingPeriod: parseRange(req.body.advanceBookingPeriod),
        priceStartingFrom: Number(req.body.priceStartingFrom), // Convert to number
        themeProposels: req.body.themeProposels,
        proposalRevisions: req.body.proposalRevisions,
      },
      policies: {
        cancellationPolicy: cancellationPolicyFileUrl,
        termsAndConditions: termsAndConditionsFileUrl,
        agreementUrl: agreementUrl,
        agreementSignedAt: agreementSignedAt,
      },
      id: req.body.id,
      venId: req.body.venId,
      rating: 0, // Default rating
    });

    const savedDecorator = await newDecorator.save();

    const vendor = await User.findOne({ id: req.body.venId });
    if (!vendor) {
      await Decorator.findByIdAndDelete(savedDecorator.id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.serviceIds.push({
      serType: "decorator",
      serId: savedDecorator.id,
    });
    await vendor.save();

    // Update section completion and profile completion
    await updateSectionCompletion(savedDecorator.id);
    res.status(201).json(savedDecorator);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const getAllDecorators = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const decorators = await Decorator.find().skip(skip).limit(itemsPerPage);

    const totaldecorators = await Decorator.countDocuments();

    res.status(200).json({
      data: decorators,
      currentPage: page,
      totalPages: Math.ceil(totaldecorators / itemsPerPage),
      totalItems: totaldecorators,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getDecoratorById = async (req, res) => {
  try {
    const decorator = await Decorator.findOne({ id: req.params.id });
    if (!decorator) {
      return res.status(404).json({ message: "Decorator not found" });
    }
    res.status(200).json(decorator);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};


export default { createDecorator, getAllDecorators , getDecoratorById };
