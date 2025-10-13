import { Router } from "express";
import catererController from "../controllers2/products/catererController.js";
import upload from "../middlewares/uploads.js";
import venueController from "../controllers2/products/venueController.js";
import decoratorController from "../controllers2/products/decoratorController.js";
// import eventPlannerController from "../controllers/products/eventPlannerController.js";
// import transportController from "../controllers/products/transportController.js";
// import invitationController from "../controllers/products/invitationController.js";
import makeupController from "../controllers2/products/makeupController.js";
// import djController from "../controllers/products/djController.js";
// import giftController from "../controllers/products/giftController.js";
// import propController from "../controllers/products/propController.js";
import photographerController from "../controllers2/products/photographerController.js";
// import vendorController from "../controllers/products/vendorController.js";
// import { getAllServices } from "../controllers/servicesController.js";
// import searchProducts from "../controllers/productController.js";

const router = Router();

router.get("/caterer", catererController.getAllCaterers);
router.get("/caterer/:id", catererController.getCatererById);
router.get("/decorator", decoratorController.getAllDecorators);
router.get("/decorator/:id", decoratorController.getDecoratorById);
// router.get("/event-planner", eventPlannerController.getAllEventPlanner);
// router.get("/gift", giftController.getAllGift);
// router.get("/invitation", invitationController.getAllInvitation);
router.get("/makeup", makeupController.getAllMakeupArtist);
router.get("/makeup/:id", makeupController.getMakeupArtistById);
// router.get("/dj", djController.getAllDjArtist);
router.get("/photographer", photographerController.getAllPav);
router.get("/photographer/:id", photographerController.getPhotographerById);
// router.get("/prop-rental", propController.getAllProp);
router.get("/venue_provider", venueController.getAllVenues);
router.get("/venue_provider/:id", venueController.getVenueById);
// router.get("/service", getAllServices);

// Add Bank Details route
// router.post("/vendor/:vendorId/bank-details", vendorController.addBankDetails); // Ensure this matches your controller function
// router.get("/vendor/:vendorId/bank-details", vendorController.getBankDetails);
// In your backend routes file (e.g., routes.js or similar)
// router.delete(
//   "/vendor/:vendorId/delete-bank-details",
//   vendorController.deleteBankDetails,
// );

// Delete bank details via POST

// Add vendor creation routes (for other types of vendors)
router.post(
  "/add-caterer",
  upload("Caterers").fields([
    { name: "menu", maxCount: 10 },
    { name: "food_safety_certificates", maxCount: 10 },
    { name: "cancellation_policy", maxCount: 1 },
    { name: "terms_and_conditions", maxCount: 1 },
    { name: "asset_images", maxCount: 20 },
    { name: "asset_videos", maxCount: 20 },
    // { name: "client_testimonials", maxCount: 10 },
  ]),
  catererController.createCaterer,
);

router.post(
  "/add-venue_provider",
  upload("Venues").fields([
    { name: "terms_and_conditions", maxCount: 1 },
    { name: "cancellation_policy", maxCount: 1 },
    { name: "insurance_policy", maxCount: 1 },
    { name: "asset_images", maxCount: 20 },
    { name: "asset_videos", maxCount: 20 },
  ]),
  venueController.createVenue,
);

// router.post(
//   "/add-event-planner",
//   upload("Event Planner").fields([
//     { name: "termsConditions", maxCount: 1 },
//     { name: "cancellationPolicy", maxCount: 1 },
//     { name: "portfolio", maxCount: 20 },
//   ]),
//   eventPlannerController.createEventPlanner,
// );

router.post(
  "/add-decorator",
  upload("Decorator").fields([
    { name: "terms_and_conditions", maxCount: 1 },
    { name: "cancellation_policy", maxCount: 1 },
    { name: "asset_images", maxCount: 20 },
    { name: "asset_videos", maxCount: 20 },
    { name: "themephotos", maxCount: 20 },
    { name: "themevideos", maxCount: 20 },
  ]),
  decoratorController.createDecorator,
);

// router.post(
//   "/add-transport",
//   upload("Transport").fields([
//     { name: "termsConditions", maxCount: 1 },
//     { name: "cancellationPolicy", maxCount: 1 },
//     { name: "portfolio", maxCount: 20 },
//   ]),
//   transportController.createTransport,
// );

// router.post(
//   "/add-invitation",
//   upload("Invitations").fields([
//     { name: "clientTestimonials", maxCount: 20 },
//     { name: "cancellation_policy", maxCount: 1 },
//     { name: "terms_and_conditions", maxCount: 1 },
//     { name: "portfolio", maxCount: 20 },
//   ]),
//   invitationController.createInvitation,
// );

router.post(
  "/add-makeup-artist",
  upload("Makeup Artists").fields([{ name: "portfolio", maxCount: 20 }]),
  makeupController.createMakeupArtist,
);

// router.post(
//   "/add-dj-artist",
//   upload("Dj Artists").fields([
//     { name: "termsAndConditions", maxCount: 1 },
//     { name: "cancellationPolicy", maxCount: 1 },
//     { name: "photos", maxCount: 20 },
//     { name: "videos", maxCount: 20 },
//   ]),
//   djController.createDjArtist,
// );

// router.post(
//   "/add-gift",
//   upload("Gifts").fields([
//     { name: "giftImages", maxCount: 20 },
//     { name: "termsAndConditions", maxCount: 1 },
//   ]),
//   giftController.createGift,
// );

// router.post(
//   "/add-prop-rental",
//   upload("Props").fields([
//     { name: "furnitureAndDecorListUrl", maxCount: 1 },
//     { name: "tentAndCanopyListUrl", maxCount: 1 },
//     { name: "itemCatalogue", maxCount: 1 },
//     { name: "audioVisualListUrl", maxCount: 1 },
//     { name: "privacyPolicy", maxCount: 1 },
//     { name: "termsAndConditions", maxCount: 1 },
//     { name: "cancellationPolicy", maxCount: 1 },
//     { name: "photos", maxCount: 20 },
//     { name: "videos", maxCount: 20 },
//   ]),
//   propController.createProp,
// );

router.post(
  "/add-photographer",
  upload("Photographers").fields([
    { name: "terms_and_conditions", maxCount: 1 },
    { name: "cancellation_policy", maxCount: 1 },
    { name: "asset_images", maxCount: 20 },
    { name: "asset_videos", maxCount: 20 },
  ]),
  photographerController.createPhotographer,
);

// router.get("/search/", searchProducts);

export default router;
