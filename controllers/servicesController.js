import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import Photographer from "../models/photographers.js";
import propRental from "../models/props.js";
import { Venue } from "../models/venue.js";

const getService = async (req, res) => {
    const { vendortype, vendorid } = req.params;

    try {
        let vendorData;

        // Fetch data based on vendor type
        switch (vendortype) {
            case "Caterer":
                vendorData = await Caterer.findOne({ id: vendorid });
                break;
            case "Decorator":
                vendorData = await Decorator.findOne({ id: vendorid });
                break;
            case "Venue Provider":
                vendorData = await Venue.findOne({ id: vendorid });
                break;
            case "Prop Rental":
                vendorData = await propRental.findOne({ id: vendorid });
                break;
            case "Photographers & Videographers":
                vendorData = await Photographer.findOne({ id: vendorid });
                break;
            default:
                return res.status(400).json({ error: "Invalid vendor type" });
        }

        // Check if vendor data exists
        if (!vendorData) {
            return res.status(404).json({ error: "Vendor not found" });
        }

        // Send vendor data as response
        return res.status(200).json(vendorData);
    } catch (error) {
        // Handle errors
        console.error(error);
        return res.status(500).json({ error: "An error occurred: " + error.message });
    }
};

export { getService };