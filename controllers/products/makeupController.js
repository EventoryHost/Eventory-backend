import MakeupArtist from "../../models/makeupArtists.js";
import MakeupArtistModel from "../../models/reduxStores/makeUpArtist.js";
import { Vendor as User } from "../../models/users.js";
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
  if (!section || typeof section !== "object") return false;

  let isComplete = true;

  for (const key of Object.keys(section)) {
    const value = section[key];
    const isFilled = Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== null && value !== "";

    if (!isFilled) {
      console.warn(
        `❌ Incomplete field: ${key}, Value: ${JSON.stringify(value)}`,
      );
      isComplete = false;
    } else {
      console.log(`✅ Filled field: ${key}`);
    }
  }

  return isComplete;
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
    // Check if artist already exists
    const alreadyExists = await MakeupArtist.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Makeup artist already exists" });
    }

    // Process photos and videos - handling both string arrays and objects with original/preview properties
    let photos = req.body.photos || [];
    let videos = req.body.videos || [];
    
    // Process photos - handle JSON strings from frontend
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
    
    // Process videos - handle JSON strings from frontend
    if (Array.isArray(videos)) {
      videos = videos.map(item => {
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
    } else if (typeof videos === 'string') {
      try {
        const parsed = JSON.parse(videos);
        videos = [parsed];
      } catch (e) {
        videos = [videos];
      }
    }

    const fieldsToCheck = [
      req.body.name, // basicDetails.name
      req.body.eventSize?.ll, // basicDetails.eventSize.ll
      req.body.eventSize?.ul, // basicDetails.eventSize.ul      req.body.description, // basicDetails.description
      req.body.eventTypes?.length > 0, // basicDetails.eventTypes
      req.body.typesOfMakeupArtists?.length > 0, // basicDetails.typesOfMakeupArtists
      req.body.serviceAreas?.length > 0, // basicDetails.serviceAreas
      req.body.address, // basicDetails.address
      // req.body.location?.lat, // basicDetails.location.lat
      // req.body.location?.lng, // basicDetails.location.lng
      // req.body.location?.pincode, // basicDetails.location.pincode (validated)
      req.body.location?.googleMapsAddress, // basicDetails.location.googleMapsAddress (optional)

      req.body.onsiteMakeup, // serviceDetails.onsiteMakeup
      req.body.customization, // serviceDetails.customization
      req.body.serviceTypes?.length > 0, // serviceDetails.serviceTypes

      req.body.photos?.length > 0, // additionalDetails.photos
      req.body.videos?.length > 0, // additionalDetails.videos
      req.body.socialMedia, // additionalDetails.socialMedia (optional)
      req.body.websiteUrl, // additionalDetails.websiteUrl (optional)
      req.body.priceStarts, // additionalDetails.priceStartingFrom

      req.body.termsAndConditions?.length > 0, // policies.termsAndConditions (optional)
      req.body.cancellationPolicy?.length > 0, // policies.cancellationPolicy (optional)
      req.body.certificateOrAwards?.length > 0, // policies.certificateOrAwards (optional)
      req.body.clientTestimonials?.length > 0, // policies.clientTestimonials (optional)

      req.body.venId, // venId (required)
    ];

    // Check if all required fields are filled
    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profileCompletion =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    console.log(
      `Profile completion came out to be -------------> : ${profileCompletion}%`,
    );

    const eventSize = parseRange(req.body.eventSize);
    console.log("Service Areas received:", req.body.serviceAreas);

    // Fetch agreement data from temporary makeup artist collection
    const tempMakeupData = await MakeupArtistModel.findOne({ id: req.body.venId });
    const agreementUrl = tempMakeupData?.agreementUrl || null;
    const agreementSignedAt = tempMakeupData?.agreementSignedAt || null;
    
    if (agreementUrl) {
      console.log("Found agreement data for makeup artist:", agreementUrl);
    }

    const newMakeupArtist = new MakeupArtist({
      type: "makeupArtist",
      isVerified: false,
      rating: 0,
      vendorType: "makeupArtist",

      basicDetails: {
        name: req.body.name,
        description: req.body.description,
        eventSize: {
          ll: eventSize.ll,
          ul: eventSize.ul,
        }, eventTypes: req.body.eventTypes.split(","),
        typesOfMakeupArtists: req.body.typesOfMakeupArtists.split(","),
        serviceAreas: req.body.serviceAreas ? req.body.serviceAreas.split(",") : [],
        address: req.body.address,
        location: {
          lat: req.body.latitude, // Latitude
          lng: req.body.longitude, // Longitude
          googleMapsAddress: req.body.address, // Google Maps address
          pincode: req.body.pincode,
        },
        profileCompletion,
      },

      serviceDetails: {
        onsiteMakeup: req.body.onsiteMakeup === "Yes",
        customization: req.body.customization === "Yes",
        serviceTypes: req.body.serviceTypes.split(","),
      },

      additionalDetails: {
        photos: Array.isArray(photos) 
          ? photos.map(url => {
              if (typeof url === 'object' && url.original && url.preview) {
                return url;
              } else if (typeof url === 'string') {
                // Generate preview URL from original
                let previewUrl = url;
                
                // Generate preview URL for images (change to .webp)
                if (url.includes('original-') && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png'))) {
                  previewUrl = url.replace('original-', 'preview-').replace(/\.(jpg|jpeg|png)$/i, '.webp');
                }
                // Generate preview URL for videos (change to .mp4)
                else if (url.includes('original-') && (url.includes('.mov') || url.includes('.avi') || url.includes('.mkv'))) {
                  previewUrl = url.replace('original-', 'preview-').replace(/\.(mov|avi|mkv)$/i, '.mp4');
                }
                
                return { 
                  original: url, 
                  preview: previewUrl
                };
              }
              return { 
                original: url, 
                preview: url
              };
            }) 
          : (photos && typeof photos === 'string' 
              ? [{ original: photos, preview: photos }] 
              : []),
        videos: Array.isArray(videos) 
          ? videos.map(url => {
              if (typeof url === 'object' && url.original && url.preview) {
                return url;
              } else if (typeof url === 'string') {
                // Generate preview URL from original
                let previewUrl = url;
                
                // Generate preview URL for images (change to .webp)
                if (url.includes('original-') && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png'))) {
                  previewUrl = url.replace('original-', 'preview-').replace(/\.(jpg|jpeg|png)$/i, '.webp');
                }
                // Generate preview URL for videos (change to .mp4)
                else if (url.includes('original-') && (url.includes('.mov') || url.includes('.avi') || url.includes('.mkv'))) {
                  previewUrl = url.replace('original-', 'preview-').replace(/\.(mov|avi|mkv)$/i, '.mp4');
                }
                
                return { 
                  original: url, 
                  preview: previewUrl
                };
              }
              return { 
                original: url, 
                preview: url
              };
            }) 
          : (videos && typeof videos === 'string' 
              ? [{ original: videos, preview: videos }] 
              : []),
        socialMedia: req.body.socialMedia || "",
        websiteUrl: req.body.websiteUrl || "",
        priceStartingFrom: req.body.priceStarts,
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
        agreementUrl: agreementUrl,
        agreementSignedAt: agreementSignedAt,
      },

      venId: req.body.venId,
    });

    const savedMakeupArtist = await newMakeupArtist.save();

    // Find and update the vendor
    const vendor = await User.findOne({ id: req.body.venId });
    if (vendor) {
      vendor.serviceIds.push({
        serType: "makeupArtist",
        serId: savedMakeupArtist.id,
      });
      await vendor.save();
    }

    // Update section completion and profile completion
    await updateSectionCompletion(savedMakeupArtist.id);
    res.status(201).json(savedMakeupArtist);
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({ error: error.message });
  }
};

const getAllMakeupArtist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;
    const skip = (page - 1) * itemsPerPage;

    const makeupArtists =
      page == -1
        ? await MakeupArtist.find()
        : await MakeupArtist.find().skip(skip).limit(itemsPerPage);

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

const getMakeupArtistById = async (req, res) => {
  try {
    const makeupArtist = await MakeupArtist.findOne({ id: req.params.id });
    if (!makeupArtist) {
      return res.status(404).json({ message: "Makeup artist not found" });
    }
    res.status(200).json(makeupArtist);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createMakeupArtist, getAllMakeupArtist , getMakeupArtistById };
