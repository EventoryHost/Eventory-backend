import { Router } from "express";
import catererController from "../controllers/products/catererController.js";
import upload from "../middlewares/uploads.js";
import venueController from "../controllers/products/venueController.js";
import decoratorController from "../controllers/products/decoratorController.js";
import eventPlannerController from "../controllers/products/eventPlannerController.js";
import transportController from "../controllers/products/transportController.js";
import invitationController from "../controllers/products/invitationController.js";
import makeupController from "../controllers/products/makeupController.js";
import giftController from "../controllers/products/giftController.js";
import propController from "../controllers/products/propController.js";
import photographerController from "../controllers/products/photographerController.js";

const router = Router();

router.get("/caterer", catererController.getAllCaterers);
router.post(
  "/add-caterer",
  upload("Caterers").fields([
    { name: "menu", maxCount: 10 },
    { name: "cancellation_policy", maxCount: 1 },
    { name: "terms_and_conditions", maxCount: 1 },
    { name: "photos", maxCount: 20 },
    { name: "videos", maxCount: 20 },
    { name: "client_testimonials", maxCount: 10 },
  ]),
  catererController.createCaterer,
);

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

router.post(
  "/add-event-planner",
  upload("Event Planner").fields([
    { name: "termsConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "portfolio", maxCount: 20 },
    {},
  ]),
  eventPlannerController.createEventPlanner,
);

router.post(
  "/add-decorator",
  upload("Event Planner").fields([
    { name: "termsConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "photos", maxCount: 20 },
    { name: "videos", maxCount: 20 },
    { name: "themePhotos", maxCount: 20 },
    { name: "themeVideos", maxCount: 20 },
    { name: "insurance", maxCount: 1 },
    { name: "onlineRatings", maxCount: 20 },
    { name: "privacyPolicy", maxCount: 1 },
  ]),
  decoratorController.createDecorator,
);

router.post(
  "/add-transport",
  upload("Transport").fields([
    { name: "termsConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "portfolio", maxCount: 20 },
  ]),
  transportController.createTransport,
);

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

router.post(
  "/add-makeup-artist",
  upload("Makeup Artists").fields([{ name: "portfolio", maxCount: 20 }]),
  makeupController.createMakeupArtist,
);

router.post(
  "/add-gift",
  upload("Gifts").fields([
    { name: "giftImages", maxCount: 20 },
    { name: "termsAndConditions", maxCount: 1 },
  ]),
  giftController.createGift,
);

router.post(
  "/add-prop-rental",
  upload("Props").fields([
    { name: "furnitureAndDecorListUrl", maxCount: 1 },
    { name: "tentAndCanopyListUrl", maxCount: 1 },
    { name: "audioVisualListUrl", maxCount: 1 },
    { name: "privacyPolicy", maxCount: 1 },
    { name: "termsAndConditions", maxCount: 1 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "insurancePolicy", maxCount: 1 },
  ]),
  propController.createProp,
);

router.post(
  "/add-photographer",
  upload("Photographers").fields([
    { name: "portfolio", maxCount: 20 },
    { name: "clientTestimonials", maxCount: 20 },
    { name: "cancellationPolicy", maxCount: 1 },
    { name: "termsAndConditions", maxCount: 1 },
  ]),
  photographerController.createPhotographer,
);

export default router;
