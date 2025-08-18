// backend/routes/businessDetails.js
import express from "express";
const router = express.Router();
// import { BusinessDetailsModel } from "../../models/reduxStores/businessDetails.js";
// import { decoratorRoutes } from "./decorator.js";
// import { giftRoutes } from "./gifts.js";
// import { venueRoutes } from "./venue-provider.js";
// import { pavRoutes } from "./pav.js";
// import { makeupArtistRoutes } from "./makeUpArtist.js";
// import { djArtistRoutes } from "./djArtist.js";
// import { propRentalRoutes } from "./prop-rental.js";
// import { invitationRoutes } from "./invitation.js";

// POST or PUT route to save or update business details
// router.post("/business-details", async (req, res) => {
//   const { id, businessDetails2 } = req.body;
  
//   console.log("Backend received request with data:", { id, businessDetails2 });

//   if (!businessDetails2) {
//     console.log("Error: No business details provided");
//     return res
//       .status(400)
//       .json({ message: "Please provide business details." });
//   }
//   const {
//     businessName,
//     category,
//     gstin,
//     panNo,
//     years,
//     businessAddress,
//     teamsize,
//     annualrevenue,
//     pinCode,
//     cities,
//     bookingsPerMonth,
//   } = businessDetails2;

//   try {
//     const existingDetails = await BusinessDetailsModel.findOne({ id });

//     if (existingDetails) {      await BusinessDetailsModel.findOneAndUpdate(
//         { id },
//         {
//           businessName,
//           category,
//           gstin,
//           panNo,
//           teamsize,
//           businessAddress,
//           pinCode,
//           cities,
//           years,
//           annualrevenue,
//           bookingsPerMonth,
//         },
//         { new: true },
//       );
//       return res
//         .status(200)
//         .json({ message: "Business details updated successfully." });
//     } else {      const newBusinessDetails = new BusinessDetailsModel({
//         id,
//         businessName,
//         category,
//         gstin,
//         panNo,
//         teamsize,
//         businessAddress,
//         pinCode,
//         cities,
//         years,
//         annualrevenue,
//         bookingsPerMonth,
//       });

//       await newBusinessDetails.save();
//       return res
//         .status(201)
//         .json({ message: "Business details saved successfully." });
//     }  } catch (error) {
//     console.error("Error in business-details endpoint:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to save or update business details.", error: error.message });
//   }
// });

// Route to fetch business details by id
// router.get("/business-details/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const businessDetails = await BusinessDetailsModel.findOne({ id });
//     if (businessDetails) {
//       res.status(200).json(businessDetails);
//     } else {
//       res.status(404).json({ message: "Business details not found." });
//     }
//   } catch (error) {
//     console.error("Error fetching business details:", error);
//     res.status(500).json({ message: "Failed to fetch business details." });
//   }
// });

// router.use("/decorator-details", decoratorRoutes);
// router.use("/gifts-details", giftRoutes);
// router.use("/venue-provider-details", venueRoutes);
// router.use("/pav-details", pavRoutes);
// router.use("/prop-rental-details", propRentalRoutes);
// router.use("/invitation-details", invitationRoutes);
// router.use("/makeup-artist-details", makeupArtistRoutes);
// router.use("/dj-artist-details", djArtistRoutes);

// Export the router
export { router as businessDetailsRoutes };
