import express from "express";
import bodyParser from "body-parser";
import { sendContactEmail } from "../controllers2/contactRoutesController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: APIs for sending contact inquiries
 */

// Apply body-parser middleware only for this route
router.use(
  "/send-contact-email",
  bodyParser.json(),
  bodyParser.urlencoded({ extended: true })
);

/**
 * @swagger
 * /api/contact/send-contact-email:
 *   post:
 *     summary: Send contact inquiry email to support
 *     tags: [Contact]
 *     ...
 */
router.post("/send-contact-email", sendContactEmail);

export default router;
