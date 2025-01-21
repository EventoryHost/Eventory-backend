import express from "express";
import { Vendor } from "../models/users.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import Photographer from "../models/photographers.js";
import PropRental from "../models/props.js";
import { Venue } from "../models/venue.js";

const router = express.Router();

// Update API for basic vendor details such as name, mobile, email
router.put("/update-service/:serviceId", async (req, res) => {
    const { serviceId } = req.params;
    const updateData = req.body;

    try {
        // Find the vendor containing the specific serviceId
        const vendor = await Vendor.findOne({ "serviceIds.serId": serviceId });

        if (!vendor) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Update vendor-level fields if provided in the request body
        if (updateData.name) vendor.name = updateData.name;
        if (updateData.mobile) vendor.mobile = updateData.mobile;
        if (updateData.email) vendor.email = updateData.email;

        // Update the relevant service in the serviceIds array
        vendor.serviceIds = vendor.serviceIds.map((service) => {
            if (service.serId === serviceId) {
                return { ...service, ...updateData }; // Merge with new data
            }
            return service;
        });

        // Save the updated document
        await vendor.save();

        res
            .status(200)
            .json({ message: "Service and vendor updated successfully", vendor });
    } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
});

// API endpoint to update service details
router.post("/updateService/:serviceId", async (req, res) => {
    const { serviceId } = req.params; // Get serviceId from the URL parameter
    const { newDescription, newCompanyName } = req.body; // Get other data from the request body

    try {
        // Fetch the vendor document by serviceId
        const vendor = await Vendor.findOne({ "serviceIds.serId": serviceId });

        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        // Find the service details based on the serviceId
        const service = vendor.serviceIds.find(
            (service) => service.serId === serviceId,
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Dynamically select the service model based on the serviceType
        let serviceDoc;
        switch (service.serType) {
            case "caterer":
                serviceDoc = await Caterer.findOne({ id: service.serId, venId: vendor.id });
                break;
            case "decorator":
                serviceDoc = await Decorator.findOne({ id: service.serId, venId: vendor.id });
                break;
                case "pav": 
            case "photographer": // Replace 'pav' with 'photographer'
                serviceDoc = await Photographer.findOne({ id: service.serId, venId: vendor.id });
                break;
            case "venue-provider":
                serviceDoc = await Venue.findOne({ id: service.serId, venId: vendor.id });
                break;
            case "prop-rental":
                serviceDoc = await PropRental.findOne({ id: service.serId, venId: vendor.id });
                break;
            default:
                return res.status(400).json({ message: "Invalid service type" });
        }
        

        if (!serviceDoc) {
            return res
                .status(404)
                .json({ message: `${service.serType} service not found` });
        }

        // Update the service document (e.g., description and company name)
        serviceDoc.basicDetails.description = newDescription;
        serviceDoc.basicDetails.name = newCompanyName;

        // Save the updated document
        await serviceDoc.save();

        return res
            .status(200)
            .json({ message: "Service updated successfully", data: serviceDoc });
    } catch (error) {
        console.error("Error updating service:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

// API endpoint to update service details
const updateServiceDetails = async (req, res) => {
    const { serId } = req.params; // Service ID from the URL
    const updateData = req.body; // Details to be updated

    try {
        // Step 1: Find the vendor's service type
        const vendor = await Vendor.findOne({ "serviceIds.serId": serId });
        if (!vendor) {
            return res.status(404).json({ error: "Vendor or service not found" });
        }

        const service = vendor.serviceIds.find(
            (service) => service.serId === serId,
        );
        const { serType } = service; // e.g., 'caterer' or 'decorator'

        let updatedService;

        // Step 2: Update the respective service based on service type
        switch (serType) {
            case "caterer":
                updatedService = await Caterer.findOneAndUpdate(
                    { id: serId },
                    { $set: updateData },
                    { new: true }, // Return the updated document
                );
                break;
            case "decorator":
                updatedService = await Decorator.findOneAndUpdate(
                    { id: serId },
                    { $set: updateData },
                    { new: true },
                );
                break;
                case "pav":
            case "photographer":
                updatedService = await Photographer.findOneAndUpdate(
                    { id: serId },
                    { $set: updateData },
                    { new: true },
                );
                break;
            case "venue-provider":
                updatedService = await Venue.findOneAndUpdate(
                    { id: serId },
                    { $set: updateData },
                    { new: true },
                );
                break;
            case "prop-rental":
                updatedService = await PropRental.findOneAndUpdate(
                    { id: serId },
                    { $set: updateData },
                    { new: true },
                );
                break;
            default:
                return res.status(400).json({ error: "Unsupported service type" });
        }

        if (!updatedService) {
            return res.status(404).json({ error: "Service not found for update" });
        }

        // Step 3: Calculate profile completion percentage
        const profileCompletion = calculateProfileCompletion(updatedService, serType);

        // Step 4: Update the profileCompletion field directly in the service
        await updatedService.updateOne({ "basicDetails.profileCompletion": profileCompletion });

        return res
            .status(200)
            .json({ message: "Details updated successfully", updatedService });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const serviceFields = {
    caterer: [
        "basicDetails.name",
        "basicDetails.managerName",
        "basicDetails.capacity",
        "basicDetails.description",
        "basicDetails.cuisine_specialities",
        "basicDetails.regional_specialities",
        "basicDetails.service_style_offered",
        "menuDetails.menu",
        "menuDetails.vegOrNonVeg",
        "menuDetails.appetizers",
        "menuDetails.main_course",
        "menuDetails.beverages",
        "menuDetails.special_dietary_options",
        "menuDetails.pre_set_menus",
        "menuDetails.customizable",
        "eventDetails.event_types_catered",
        "eventDetails.additional_services",
        "staffAndEquipmentDetails.staff_provided",
        "staffAndEquipmentDetails.equipment_provided",
        "additionalDetails.minimum_order_requirements",
        "additionalDetails.advance_booking_period",
        "additionalDetails.photos",
        "additionalDetails.videos",
        "additionalDetails.tasting_sessions",
        "additionalDetails.business_licenses",
        "additionalDetails.food_safety_certificates",
        "additionalDetails.priceStartingFrom",
        "policies.cancellation_policy",
        "policies.terms_and_conditions",
        "policies.client_testimonials"
    ],
    decorator: [
        "basicDetails.name",
        "basicDetails.description",
        "basicDetails.eventSize",
        "basicDetails.duration",
        "themesOffered.themesOffered",
        "themesOffered.customDesignProcess",
        "themesElement.themeElements",
        "themesElement.themePhotos",
        "themesElement.themeVideos",
        "additionalDetails.photos",
        "additionalDetails.videos",
        "additionalDetails.clientTestimonials",
        "additionalDetails.awards",
        "additionalDetails.website",
        "additionalDetails.instagram",
        "additionalDetails.advanceBookingPeriod",
        "additionalDetails.priceStartingFrom",
        "additionalDetails.themeProposels",
        "additionalDetails.proposalRevisions",
        "policies.cancellationPolicy",
        "policies.termsAndConditions",
    ],
    pav: [
        "basicDetails.name",
        "basicDetails.description",
        "basicDetails.eventSize",
        "basicDetails.eventTypes",
        "Videography.equipmentAvailable",
        "Videography.typesOfStyles",
        "Videography.addonsOrUpgradeAvailable",
        "Videography.finalDeliveryMethods",
        "Photography.equipmentAvailable",
        "Photography.typesOfStyles",
        "Photography.addonsOrUpgradeAvailable",
        "Photography.finalDeliveryMethods",
        "consultationDetails.duration",
        "consultationDetails.PackageTypes",
        "consultationDetails.proposalsToClients",
        "consultationDetails.freeInitialConsultation",
        "consultationDetails.bookingDeposit",
        "consultationDetails.availableForDestinationEvents",
        "consultationDetails.AdvanceSetup",
        "consultationDetails.postProductionServices",
        "additionalDetails.photos",
        "additionalDetails.videos",
        "additionalDetails.clientTestimonials",
        "additionalDetails.awards",
        "additionalDetails.website",
        "additionalDetails.instagram",
        "additionalDetails.priceStartingFrom",
        "policies.cancellationPolicy",
        "policies.termsAndConditions",
    ],
    "venue-provider": [
        "basicDetails.name",
        "basicDetails.managerName",
        "basicDetails.capacity",
        "basicDetails.operatingHours.openingTime",
        "basicDetails.operatingHours.closingTime",
        "basicDetails.address",
        "basicDetails.description",
        "featureDetails.catererServices",
        "featureDetails.decorServices",
        "featureDetails.venueTypes",
        "featureDetails.audioVisualEquipment",
        "featureDetails.accessibilityFeatures",
        "featureDetails.restrictionsPolicies",
        "featureDetails.specialFeatures",
        "featureDetails.facilities",
        "additionalDetails.photos",
        "additionalDetails.videos",
        "additionalDetails.awards",
        "additionalDetails.clientTestimonials",
        "additionalDetails.instagramURL",
        "additionalDetails.websiteURL",
        "additionalDetails.advanceBookingPeriod",
        "additionalDetails.priceStartingFrom",
        "policies.termsConditions",
        "policies.cancellationPolicy",
        "policies.insurancePolicy",
    ],
    "prop-rental": [
        "basicDetails.managerName",
        "basicDetails.description",
        "basicDetails.eventSize",
        "serviceDetails.itemCatalogue",
        "serviceDetails.customization",
        "serviceDetails.maintenance",
        "serviceDetails.services",
        "serviceDetails.serviceProvided",
        "additionalDetails.photos",
        "additionalDetails.videos",
        "additionalDetails.awardsAndRecognize",
        "additionalDetails.clientTestimonial",
        "additionalDetails.instaUrl",
        "additionalDetails.websiteUrl",
        "additionalDetails.priceStartingFrom",
        "policies.cancellationPolicy",
        "policies.termsAndConditions",
        "furnitureAndDecor.listUrl",
        "furnitureAndDecor.typeOfEvents",
        "furnitureAndDecor.furniture",
        "furnitureAndDecor.decor",
        "tentAndCanopy.listUrl",
        "tentAndCanopy.typeOfEvents",
        "tentAndCanopy.items",
        "audioVisual.listUrl",
        "audioVisual.typeOfEvents",
        "audioVisual.audioEquipment",
        "audioVisual.visualEquipment",
        "audioVisual.lightEquipment",
    ],
};


// Define the route to update service details
router.put("/updateService/:serId", updateServiceDetails);

const calculateProfileCompletion = (serviceData, serviceType) => {
    console.log(`Calculating profile completion for ${serviceType} service...`);
    const requiredFields = serviceFields[serviceType];
    if (!requiredFields) {
        throw new Error(`Unknown service type: ${serviceType}`);
    }

    let filledFields = 0;

    requiredFields.forEach((field) => {
        const fieldPath = field.split("."); // Split by '.' to handle nested fields
        let currentValue = serviceData;

        // Traverse through the field path
        for (let key of fieldPath) {
            if (currentValue[key] !== undefined && currentValue[key] !== null) {
                currentValue = currentValue[key];
            } else {
                console.log(`Field ${field} XXXXXXX`);
                return; // Field is not filled, exit early
            }
        }

        // Check if the final value is filled (non-empty string or non-null)
        if (currentValue?.toString().trim()) {
            filledFields += 1;
            console.log(`Field ${field} OK`);
        } else {
            console.log(`Field ${field} XXXXXXX`);
        }
    });

    const completionPercentage = (filledFields / requiredFields.length) * 100;
    console.log(`Profile completion: ${completionPercentage}%`);
    return Math.round(completionPercentage); // Return an integer percentage
};




export default router;
