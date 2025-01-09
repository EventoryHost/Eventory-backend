import express from "express";
import { Vendor } from "../models/users.js"
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import Photographer  from "../models/photographers.js";
import  PropRental  from "../models/props.js";
import  { Venue }  from "../models/venue.js";

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
        vendor.serviceIds = vendor.serviceIds.map(service => {
            if (service.serId === serviceId) {
                return { ...service, ...updateData }; // Merge with new data
            }
            return service;
        });

        // Save the updated document
        await vendor.save();

        res.status(200).json({ message: "Service and vendor updated successfully", vendor });
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
        const service = vendor.serviceIds.find((service) => service.serId === serviceId);

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
            return res.status(404).json({ message: `${service.serType} service not found` });
        }

        // Update the service document (e.g., description and company name)
        serviceDoc.basicDetails.description = newDescription;
        serviceDoc.basicDetails.name = newCompanyName;

        // Save the updated document
        await serviceDoc.save();

        return res.status(200).json({ message: "Service updated successfully", data: serviceDoc });
    } catch (error) {
        console.error("Error updating service:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

export default router;
