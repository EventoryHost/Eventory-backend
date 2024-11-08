import express from 'express';
import { CateringModel } from '../models/reduxStores/catering.js'; 
import { DecoratorModel } from '../models/reduxStores/decorator.js';
import PAVModel from '../models/reduxStores/pav.js';


const router = express.Router();

// Helper function to get the correct model based on flow type
const getModelByFlowType = (flowType) => {
    switch (flowType) {
        case 'caterer':
            return CateringModel;
        case 'decorator':
            return DecoratorModel;
        case 'pav':
            return PAVModel;
        default:
            return null;
    }
};

// Route to update page number for a vendor
router.put('/:flowType/updatePageNumber', async (req, res) => {
    const { flowType } = req.params;
    const { vendorId, pageNumber } = req.body;

    try {
        const Model = getModelByFlowType(flowType);

        if (!Model) {
            return res.status(400).json({ message: 'Invalid flow type' });
        }

        // Update the page number in the vendor's record
        const updatedVendor = await Model.findOneAndUpdate(
            { id: vendorId },             // Match vendor by ID
            { pageNumber },                // Set new page number
            { new: true }                  // Return the updated document
        );

        if (!updatedVendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json({
            message: 'Page number updated successfully',
            updatedPageNumber: updatedVendor.pageNumber
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// New route to fetch the last visited page number for a vendor
router.get('/:flowType/getLastPageNumber/:vendorId', async (req, res) => {
    const { flowType, vendorId } = req.params;

    try {
        const Model = getModelByFlowType(flowType);

        if (!Model) {
            return res.status(400).json({ message: 'Invalid flow type' });
        }

        // Fetch the vendor document by vendorId
        const vendor = await Model.findOne({ id: vendorId });

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Return the page number (last visited page)
        res.json({
            lastPageNumber: vendor.pageNumber || 1 // Return 1 if pageNumber is not set
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


export default router;