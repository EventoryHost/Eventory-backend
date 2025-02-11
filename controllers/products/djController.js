import DjArtist from "../../models/djArtist.js";
import { Vendor as User } from "../../models/users.js";

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

const createDjArtist = async (req, res) => {
    try {
        console.log("Received Data:", req.body); // ��️ Log full request body
        const alreadyExists = await DjArtist.findOne({
            name: req.body.name,
            venId: req.body.venId,
        });
        if (alreadyExists) {
            return res.status(400).json({ message: "DJ Artist already exists" });
        }
        const newDjArtist = new DjArtist({
            basicDetails: {
                name: req.body.name,
                contact: req.body.contact,
                description: req.body.description,
            },
            serviceDetails: {
                eventTypes: req.body.eventTypes.split(","),
                musicGenres: req.body.musicGenres.split(","),
                regionalSpecializations: req.body.regionalSpecializations.split(","),
                serviceTypes: req.body.serviceTypes.split(","),
            },
            additionalDetails: {
                photos: req.body.photos,
                videos: req.body.videos,
                awards: req.body.awards,
                instagramURL: req.body.instagramURL,
                websiteURL: req.body.websiteURL,
                testimonials: req.body.testimonials,
                priceStarts: req.body.priceStarts,
            },
            policies: {
                termsAndConditions: req.body.termsAndConditions ? req.body.termsAndConditions.split(",") : [],
                cancellationPolicy: req.body.cancellationPolicy ? req.body.cancellationPolicy.split(",") : [],
            },
            venId: req.body.venId,
        });
        const savedDjArtist = await newDjArtist.save();
        const vendor = await User.findOne({ id: req.body.venId });
        if (!vendor) {
            await DjArtist.findByIdAndDelete(savedDjArtist.id);
            return res.status(404).json({ message: "Vendor not found" });
        }

            // ✅ Add the `serId` with the correct `serType`
        vendor.serviceIds.push({
        serType: "djArtist",  // Correct service type
        serId: savedDjArtist.id,
      });

        await vendor.save();

        res.status(201).json(savedDjArtist);

    }catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
      }
    };

    const getAllDjArtist = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const itemsPerPage = 9;
            const skip = (page - 1) * itemsPerPage;
            const djArtists = await DjArtist.find()
                .skip(skip)
                .limit(itemsPerPage);
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
