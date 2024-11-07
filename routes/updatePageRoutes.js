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

export default router;