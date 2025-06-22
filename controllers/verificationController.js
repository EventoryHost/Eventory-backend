import axios from "axios";
import dotenv from "dotenv";
import { generateSignature } from "../utils/generateId.js";
import { Vendor as User } from "../models/users.js";

dotenv.config();

const verifyGSTIN = async (req, res) => {
  const { gstIn } = req.params;

  if (!gstIn) {
    return res.status(400).json({ message: "Please provide a GSTIN number" });
  }

  const gstinPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
  if (!gstinPattern.test(gstIn)) {
    return res.status(400).json({ message: "Invalid GSTIN format" });
  }
  
  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    let publicKey = `-----BEGIN PUBLIC KEY-----\n${process.env.CASHFREE_PUBLIC_KEY}\n-----END PUBLIC KEY-----`;

    const timestamp = Math.floor(Date.now() / 1000);

    const signature = generateSignature(clientId, publicKey, timestamp);

    const url = `https://api.cashfree.com/verification/gstin`;

    const headers = {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "X-Cf-Signature": signature,
      "X-Timestamp": timestamp.toString(),
      "Content-Type": "application/json",
    };
    
    const response = await axios.post(url, { gstin: gstIn }, { headers });
    
    console.log("GSTIN Verification response:", response.data);
    
    // Format the response to include the legal name in a standardized way
    if (response.data && response.data.legal_name_of_business) {
      return res.status(200).json({
        status: "SUCCESS",
        legal_name: response.data.legal_name_of_business,
        message: "GSTIN verified successfully",
        originalResponse: response.data
      });
    } else if (response.data) {
      // If we have response data but not the expected field, return what we have
      return res.status(200).json({
        status: "SUCCESS",
        legal_name: response.data.trade_name_of_business || "Verified",
        message: "GSTIN verified successfully but name may be limited",
        originalResponse: response.data
      });
    }
  } catch (error) {
    console.error("Error verifying GSTIN:", error);
    
    if (error.response) {
      const { status } = error.response;
      console.error("GSTIN API error response:", {
        status,
        data: error.response.data
      });

      if (status === 429) {
        return res
          .status(429)
          .json({ message: "Too many requests, please try again later" });
      }

      if (status === 404) {
        return res.status(404).json({ message: "GSTIN not found" });
      }

      return res.status(status).json({
        message: "Error from GSTIN API",
        details: error.response.data,
      });
    }

    console.error("Unexpected error:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const verifyPAN = async (req, res) => {
  const { panNo } = req.params;
  const userId = req.query.userId; // Get userId from query params if provided

  if (!panNo) {
    return res.status(400).json({ message: "Please provide a PAN card number" });
  }

  // PAN card format validation - 5 letters followed by 4 numbers and then 1 letter
  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panPattern.test(panNo)) {
    return res.status(400).json({ message: "Invalid PAN card format" });
  }

  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    let publicKey = `-----BEGIN PUBLIC KEY-----\n${process.env.CASHFREE_PUBLIC_KEY}\n-----END PUBLIC KEY-----`;

    const timestamp = Math.floor(Date.now() / 1000);
    
    const signature = generateSignature(clientId, publicKey, timestamp);

    const url = `https://api.cashfree.com/verification/pan`;

    const headers = {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "X-Cf-Signature": signature,
      "X-Timestamp": timestamp.toString(),
      "Content-Type": "application/json",
    };
    
    // First, verify the PAN
    const panResponse = await axios.post(url, { pan: panNo }, { headers });
    
    console.log("PAN Verification response:", panResponse.data);
    
    // If PAN is valid, try to fetch associated GSTINs
    let gstinList = [];
    
    try {
      // Create a unique verification ID for the PAN-GSTIN request
      const verification_id = `eventory_${Date.now()}_${panNo}`;
      
      const gstinResponse = await axios.post(
        `https://api.cashfree.com/verification/pan-gstin`, 
        { 
          pan: panNo, 
          verification_id: verification_id 
        }, 
        { headers }
      );
      
      console.log("GSTIN from PAN response:", gstinResponse.data);
      
      if (gstinResponse.data && gstinResponse.data.gstin_list) {
        gstinList = gstinResponse.data.gstin_list;
        
        // If userId is provided, store the first active GSTIN in the user's profile
        if (userId && gstinList.length > 0) {
          try {
            // Find the user
            const user = await User.findOne({ id: userId });
            
            if (user) {
              // Find the first active GSTIN
              const activeGstin = gstinList.find(g => g.status === "ACTIVE");
              
              if (activeGstin) {
                // Update the user's businessDetails
                if (!user.businessDetails) {
                  user.businessDetails = {};
                }
                
                // Store both PAN and GSTIN
                user.businessDetails.panNo = panNo;
                user.businessDetails.gstin = activeGstin.gstin;
                
                // Save the changes
                await user.save();
                console.log(`Updated user ${userId} with GSTIN ${activeGstin.gstin} from PAN verification`);
              }
            } else {
              console.log(`User not found with ID: ${userId}`);
            }
          } catch (userError) {
            console.error("Error updating user with GSTIN:", userError);
            // Don't fail the API response if this part fails
          }
        }
      }
    } catch (gstinError) {
      // Just log the error but don't fail the entire request
      // This way, even if GSTIN lookup fails, we still return the PAN verification
      console.error("Error fetching GSTINs from PAN:", gstinError);
    }
    
    // Extract registered name
    const registeredName = panResponse.data.name || 
                          panResponse.data.pan_holder_name || 
                          panResponse.data.registered_name || 
                          "Verified";
    
    // Return combined response with both PAN verification and GSTIN list
    res.status(200).json({
      status: "SUCCESS",
      name: registeredName,
      registered_name: registeredName,
      message: "PAN Card verified successfully",
      gstin_list: gstinList, // Include the GSTIN list in the response
      originalResponse: panResponse.data
    });
  } catch (error) {
    console.error("Error verifying PAN:", error);
    
    if (error.response) {
      const { status } = error.response;
      console.error("PAN API error response:", {
        status,
        data: error.response.data
      });

      if (status === 429) {
        return res
          .status(429)
          .json({ message: "Too many requests, please try again later" });
      }

      if (status === 404) {
        return res.status(404).json({ message: "PAN card not found" });
      }

      return res.status(status).json({
        message: "Error from PAN verification API",
        details: error.response.data,
      });
    }

    console.error("Unexpected error:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export { verifyGSTIN, verifyPAN };
