// routes/venueQuotationRoutes.js

import express from 'express';
import VenueQuotation from '../models/venueQuotation.js'; 
import User from '../models/rmadmin.js';

const router = express.Router();

// Route to get all venue quotations
router.get('/quotations', async (req, res) => {
    try {
        const quotations = await VenueQuotation.find(); 
        res.json(quotations);
    } catch (error) {
        console.error("Error fetching venue quotations:", error);
        res.status(500).json({ message: "Failed to fetch venue quotations" });
    }
});

router.post('/rmauth' , async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

    if(!user){
        return res.status(404).json({ success:false ,message: "User not found" });
    }

    if( user.password !== password ){
        return res.status(401).json({success:false,  message: "Invalid Credentials "})
    }

    return res.status(200).json({ success:true , message: "Authentication Successful" });

    } catch (error) {
        console.error("Error authenticating user:", error);
        res.status(500).json({success:false,  message: "Failed to authenticate user" });
    }

    

});

export default router;
