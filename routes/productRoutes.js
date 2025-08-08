import { Router } from "express";
import catererController from "../controllers/products/catererController.js";
import getCatererById from "../controllers/products/catererController.js";
import upload from "../middlewares/uploads.js";
import venueController from "../controllers/products/venueController.js";

import decoratorController from "../controllers/products/decoratorController.js";
import getDecoratorById from "../controllers/products/decoratorController.js";
import eventPlannerController from "../controllers/products/eventPlannerController.js";
import transportController from "../controllers/products/transportController.js";
import invitationController from "../controllers/products/invitationController.js";
import makeupController from "../controllers/products/makeupController.js";
import getMakeupArtistById from "../controllers/products/makeupController.js";
import djController from "../controllers/products/djController.js";

import giftController from "../controllers/products/giftController.js";
import propController from "../controllers/products/propController.js";

import photographerController from "../controllers/products/photographerController.js";
import getPhotographerById from "../controllers/products/photographerController.js";
import vendorController from "../controllers/products/vendorController.js";
import { getAllServices } from "../controllers/servicesController.js";
import searchProducts from "../controllers/productController.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Endpoints for retrieving product/service listings
 *   - name: Vendors
 *     description: Endpoints related to vendors and their details
 */

/**
 * @swagger
 * /caterer:
 *   get:
 *     summary: Get all caterers
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of caterers retrieved successfully
 */

router.get("/caterer", catererController.getAllCaterers);
/**
 * @swagger
 * /decorator:
 *   get:
 *     summary: Get all decorators
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of decorators retrieved successfully
 */
router.get("/decorator", decoratorController.getAllDecorators);
/**
 * @swagger
 * /event-planner:
 *   get:
 *     summary: Get all event planners
 *     tags: [Products]
 */
router.get("/event-planner", eventPlannerController.getAllEventPlanner);
/**
 * @swagger
 * /gift:
 *   get:
 *     summary: Get all gifts
 *     tags: [Products]
 */
router.get("/gift", giftController.getAllGift);
/**
 * @swagger
 * /invitation:
 *   get:
 *     summary: Get all invitations
 *     tags: [Products]
 */
router.get("/invitation", invitationController.getAllInvitation);
/**
 * @swagger
 * /makeup:
 *   get:
 *     summary: Get all makeup artists
 *     tags: [Products]
 */
router.get("/makeup", makeupController.getAllMakeupArtist);
/**
 * @swagger
 * /dj:
 *   get:
 *     summary: Get all DJ artists
 *     tags: [Products]
 */
router.get("/dj", djController.getAllDjArtist);
/**
 * @swagger
 * /pav:
 *   get:
 *     summary: Get all photographers
 *     tags: [Products]
 */
router.get("/pav", photographerController.getAllPav);
/**
 * @swagger
 * /prop-rental:
 *   get:
 *     summary: Get all prop rentals
 *     tags: [Products]
 */
router.get("/prop-rental", propController.getAllProp);

/**
 * @swagger
 * /venue:
 *   get:
 *     summary: Get all venues
 *     tags: [Products]
 */
router.get("/venue", venueController.getAllVenues);

/**
 * @swagger
 * /service:
 *   get:
 *     summary: Get all services
 *     tags: [Products]
 */
router.get("/service", getAllServices);

/**
 * @swagger
 * /{vendor}/{id}:
 *   get:
 *     summary: Get vendor details by category and ID
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: vendor
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor category (e.g., caterer, decorator)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor details retrieved successfully
 *       404:
 *         description: Vendor not found
 */
// Adding vendor-specific routes
router.get("/:vendor/:id", vendorController.getVendorByIdAndCategory);

/**
 * @swagger
 * /vendor/{vendorId}/bank-details:
 *   post:
 *     summary: Add bank details for a vendor
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bankName: { type: string }
 *               accountNumber: { type: string }
 *               ifscCode: { type: string }
 *     responses:
 *       200:
 *         description: Bank details added successfully
 */
// Add Bank Details route
router.post("/vendor/:vendorId/bank-details", vendorController.addBankDetails); // Ensure this matches your controller function
/**
 * @swagger
 * /vendor/{vendorId}/bank-details:
 *   get:
 *     summary: Get vendor's bank details
 *     tags: [Vendors]
 */
router.get("/vendor/:vendorId/bank-details", vendorController.getBankDetails);

/**
 * @swagger
 * /vendor/{vendorId}/delete-bank-details:
 *   delete:
 *     summary: Delete vendor's bank details
 *     tags: [Vendors]
 */
// In your backend routes file (e.g., routes.js or similar)
router.delete(
  "/vendor/:vendorId/delete-bank-details",
  vendorController.deleteBankDetails,
);

// Delete bank details via POST
/**
 * @swagger
 * /add-caterer:
 *   post:
 *     summary: Add a new caterer
 *     tags: [Vendors]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               menu:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               food_safety_certificates:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               cancellation_policy:
 *                 type: string
 *                 format: binary
 *               terms_and_conditions:
 *                 type: string
 *                 format: binary
 *               photos:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               videos:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               client_testimonials:
 *                 type: array
 *                 items: { type: string, format: binary }
 */
// Add vendor creation routes (for other types of vendors)
router.post(
  "/add-caterer",
  upload("Caterers").fields([
    { name: "menu", maxCount: 10 },
    { name: "food_safety_certificates", maxCount: 10 },
    { name: "cancellation_policy", maxCount: 1 },
    { name: "terms_and_conditions", maxCount: 1 },
    { name: "photos", maxCount: 20 },
    { name: "videos", maxCount: 20 },
    { name: "client_testimonials", maxCount: 10 },
  ]),
  catererController.createCaterer,
);
/**
 * @swagger
 * /add-venue:
 *   post:
 *     summary: Add a new venue
 *     tags: [Venues]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: termsConditions
 *         type: file
 *         description: Terms and conditions document.
 *       - in: formData
 *         name: cancellationPolicy
 *         type: file
 *         description: Cancellation policy document.
 *       - in: formData
 *         name: insurancePolicy
 *         type: file
 *         description: Insurance policy document.
 *       - in: formData
 *         name: photos
 *         type: array
 *         items:
 *           type: file
 *         description: Venue photos.
 *       - in: formData
 *         name: videos
 *         type: array
 *         items:
 *           type: file
 *         description: Venue videos.
 *     responses:
 *       201:
 *         description: Venue created successfully.
 */
router.post(
  "/add-venue",
  upload("Venues").fields([
    { name: "termsConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "insurancePolicy", maxCount: 1 },
    { name: "photos", maxCount: 20 },
    { name: "videos", maxCount: 20 },
  ]),
  venueController.createVenue,
);
/**
 * @swagger
 * /add-event-planner:
 *   post:
 *     summary: Add a new event planner
 *     tags: [Event Planners]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: termsConditions
 *         type: file
 *         description: Terms and conditions document.
 *       - in: formData
 *         name: cancellationPolicy
 *         type: file
 *         description: Cancellation policy document.
 *       - in: formData
 *         name: portfolio
 *         type: array
 *         items:
 *           type: file
 *         description: Event planner portfolio images or videos.
 *     responses:
 *       201:
 *         description: Event planner created successfully.
 */

router.post(
  "/add-event-planner",
  upload("Event Planner").fields([
    { name: "termsConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "portfolio", maxCount: 20 },
  ]),
  eventPlannerController.createEventPlanner,
);
/**
 * @swagger
 * /add-decorator:
 *   post:
 *     summary: Add a new decorator
 *     tags: [Decorators]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: termsAndConditions
 *         type: file
 *         description: Terms and conditions document.
 *       - in: formData
 *         name: cancellationPolicy
 *         type: file
 *         description: Cancellation policy document.
 *       - in: formData
 *         name: photos
 *         type: array
 *         items:
 *           type: file
 *         description: Decorator photos.
 *       - in: formData
 *         name: videos
 *         type: array
 *         items:
 *           type: file
 *         description: Decorator videos.
 *       - in: formData
 *         name: themephotos
 *         type: array
 *         items:
 *           type: file
 *         description: Theme-based photos.
 *       - in: formData
 *         name: themevideos
 *         type: array
 *         items:
 *           type: file
 *         description: Theme-based videos.
 *     responses:
 *       201:
 *         description: Decorator created successfully.
 */
router.post(
  "/add-decorator",
  upload("Decorator").fields([
    { name: "termsAndConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "photos", maxCount: 20 },
    { name: "videos", maxCount: 20 },
    { name: "themephotos", maxCount: 20 },
    { name: "themevideos", maxCount: 20 },
  ]),
  decoratorController.createDecorator,
);
/**
 * @swagger
 * /add-transport:
 *   post:
 *     summary: Add a new transport service
 *     tags: [Transport]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: termsConditions
 *         type: file
 *         description: Terms and conditions document.
 *       - in: formData
 *         name: cancellationPolicy
 *         type: file
 *         description: Cancellation policy document.
 *       - in: formData
 *         name: portfolio
 *         type: array
 *         items:
 *           type: file
 *         description: Transport service portfolio images or videos.
 *     responses:
 *       201:
 *         description: Transport service created successfully.
 */

router.post(
  "/add-transport",
  upload("Transport").fields([
    { name: "termsConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "portfolio", maxCount: 20 },
  ]),
  transportController.createTransport,
);
/**
 * @swagger
 * /add-invitation:
 *   post:
 *     summary: Add a new invitation service
 *     tags: [Invitations]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: clientTestimonials
 *         type: array
 *         items:
 *           type: file
 *         description: Client testimonial files.
 *       - in: formData
 *         name: cancellation_policy
 *         type: file
 *         description: Cancellation policy document.
 *       - in: formData
 *         name: terms_and_conditions
 *         type: file
 *         description: Terms and conditions document.
 *       - in: formData
 *         name: portfolio
 *         type: array
 *         items:
 *           type: file
 *         description: Invitation portfolio images or videos.
 *     responses:
 *       201:
 *         description: Invitation service created successfully.
 */
router.post(
  "/add-invitation",
  upload("Invitations").fields([
    { name: "clientTestimonials", maxCount: 20 },
    { name: "cancellation_policy", maxCount: 1 },
    { name: "terms_and_conditions", maxCount: 1 },
    { name: "portfolio", maxCount: 20 },
  ]),
  invitationController.createInvitation,
);
/**
 * @swagger
 * /add-makeup-artist:
 *   post:
 *     summary: Add a new makeup artist
 *     tags: [Makeup Artists]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: portfolio
 *         type: array
 *         items:
 *           type: file
 *         description: Makeup artist portfolio images.
 *     responses:
 *       201:
 *         description: Makeup artist created successfully.
 */
router.post(
  "/add-makeup-artist",
  upload("Makeup Artists").fields([{ name: "portfolio", maxCount: 20 }]),
  makeupController.createMakeupArtist,
);
/**
 * @swagger
 * /add-dj-artist:
 *   post:
 *     summary: Add a new DJ artist
 *     tags: [DJ Artists]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: termsAndConditions
 *         type: file
 *         description: Terms and conditions document.
 *       - in: formData
 *         name: cancellationPolicy
 *         type: file
 *         description: Cancellation policy document.
 *       - in: formData
 *         name: photos
 *         type: array
 *         items:
 *           type: file
 *         description: DJ artist photos.
 *       - in: formData
 *         name: videos
 *         type: array
 *         items:
 *           type: file
 *         description: DJ artist videos.
 *     responses:
 *       201:
 *         description: DJ artist created successfully.
 */
router.post(
  "/add-dj-artist",
  upload("Dj Artists").fields([
    { name: "termsAndConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "photos", maxCount: 20 },
    { name: "videos", maxCount: 20 },
  ]),
  djController.createDjArtist,
);
/**
 * @swagger
 * /add-gift:
 *   post:
 *     summary: Add a new gift item
 *     tags: [Gifts]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: giftImages
 *         type: array
 *         items:
 *           type: file
 *         description: Gift images.
 *       - in: formData
 *         name: termsAndConditions
 *         type: file
 *         description: Terms and conditions document.
 *     responses:
 *       201:
 *         description: Gift created successfully.
 */

router.post(
  "/add-gift",
  upload("Gifts").fields([
    { name: "giftImages", maxCount: 20 },
    { name: "termsAndConditions", maxCount: 1 },
  ]),
  giftController.createGift,
);
/**
 * @swagger
 * /add-prop-rental:
 *   post:
 *     summary: Add a new prop rental
 *     tags: [Prop Rentals]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: furnitureAndDecorListUrl
 *         type: file
 *         description: Furniture and decor list document.
 *       - in: formData
 *         name: tentAndCanopyListUrl
 *         type: file
 *         description: Tent and canopy list document.
 *       - in: formData
 *         name: itemCatalogue
 *         type: file
 *         description: Item catalogue document.
 *       - in: formData
 *         name: audioVisualListUrl
 *         type: file
 *         description: Audio visual list document.
 *       - in: formData
 *         name: privacyPolicy
 *         type: file
 *         description: Privacy policy document.
 *       - in: formData
 *         name: termsAndConditions
 *         type: file
 *         description: Terms and conditions document.
 *       - in: formData
 *         name: cancellationPolicy
 *         type: file
 *         description: Cancellation policy document.
 *       - in: formData
 *         name: photos
 *         type: array
 *         items:
 *           type: file
 *         description: Prop rental photos.
 *       - in: formData
 *         name: videos
 *         type: array
 *         items:
 *           type: file
 *         description: Prop rental videos.
 *     responses:
 *       201:
 *         description: Prop rental created successfully.
 */

router.post(
  "/add-prop-rental",
  upload("Props").fields([
    { name: "furnitureAndDecorListUrl", maxCount: 1 },
    { name: "tentAndCanopyListUrl", maxCount: 1 },
    { name: "itemCatalogue", maxCount: 1 },
    { name: "audioVisualListUrl", maxCount: 1 },
    { name: "privacyPolicy", maxCount: 1 },
    { name: "termsAndConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "photos", maxCount: 20 },
    { name: "videos", maxCount: 20 },
  ]),
  propController.createProp,
);
/**
 * @swagger
 * /add-photographer:
 *   post:
 *     summary: Add a new photographer
 *     tags: [Photographers]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: termsAndConditions
 *         type: file
 *         description: Terms and conditions document.
 *       - in: formData
 *         name: cancellationPolicy
 *         type: file
 *         description: Cancellation policy document.
 *       - in: formData
 *         name: photos
 *         type: array
 *         items:
 *           type: file
 *         description: Photographer photos.
 *       - in: formData
 *         name: videos
 *         type: array
 *         items:
 *           type: file
 *         description: Photographer videos.
 *     responses:
 *       201:
 *         description: Photographer created successfully.
 */
router.post(
  "/add-photographer",
  upload("Photographers").fields([
    { name: "termsAndConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "photos", maxCount: 20 },
    { name: "videos", maxCount: 20 },
  ]),
  photographerController.createPhotographer,
);

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search products/services
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query string
 */
router.get("/search/", searchProducts);



// Indivisual product routes to fetch any service by ID
/**
 * @swagger
 * /caterer/{id}:
 *   get:
 *     summary: Get Caterer by ID
 *     tags:
 *       - Caterer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The caterer ID to retrieve
 *     responses:
 *       200:
 *         description: Caterer details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caterer'
 *       404:
 *         description: Caterer not found
*/
router.get("/caterer/:id", catererController.getCatererById);

/**
 * @swagger
 * /decorator/{id}:
 *   get:
 *     summary: Get Decorator by ID
 *     tags:
 *       - Decorator
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The decorator ID to retrieve
 *     responses:
 *       200:
 *         description: Decorator details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Decorator'
 *       404:
 *         description: Decorator not found
*/
router.get("/decorator/:id", decoratorController.getDecoratorById);

/**
 * @swagger
 * /pav/{id}:
 *   get:
 *     summary: Get Photographer by ID
 *     tags:
 *       - Photographer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The photographer ID to retrieve
 *     responses:
 *       200:
 *         description: Photographer details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Photographer'
 *       404:
 *         description: Photographer not found
*/
router.get("/pav/:id", photographerController.getPhotographerById);

/**
 * @swagger
 * /makeup-artist/{id}:
 *   get:
 *     summary: Get Makeup Artist by ID
 *     tags:
 *       - Makeup Artist
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The makeup artist ID to retrieve
 *     responses:
 *       200:
 *         description: Makeup artist details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MakeupArtist'
 *       404:
 *         description: Makeup artist not found
*/
router.get("/makeup-artist/:id", makeupController.getMakeupArtistById);

/**
 * @swagger
 * /dj-artist/{id}:
 *   get:
 *     summary: Get DJ Artist by ID
 *     tags:
 *       - DJ Artist
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The DJ artist ID to retrieve
 *     responses:
 *       200:
 *         description: DJ artist details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DjArtist'
 *       404:
 *         description: DJ artist not found
 */
router.get("/dj-artist/:id", djController.getDjArtistById);

/**
 * @swagger
 * /venue/{id}:
 *   get:
 *     summary: Get Venue by ID
 *     tags:
 *       - Venue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The venue ID to retrieve
 *     responses:
 *       200:
 *         description: Venue details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venue'
 *       404:
 *         description: Venue not found
 */
router.get("/venue/:id", venueController.getVenueById);


export default router;
