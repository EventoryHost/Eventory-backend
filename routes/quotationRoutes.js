import express from "express";
import { 
  createQuotation,
  getQuotationsByVendorId,
  getAllQuotations,
  updateQuotationStatus,
  getQuotationById,
  getQuotations,
  deleteQuotation,
} from "../controllers/quotationController.js";

export default (io) => {
const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Quotations
 * description: Quotation management APIs
 */

/**
 * @swagger
 * /quotations:
 * post:
 * summary: Create a new quotation
 * tags: [Quotations]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - customer_id
 * - vendor_id
 * - service_id
 * - customer_name
 * - customer_contact_number
 * - event_location
 * - event_start
 * - event_end
 * - guest_count
 * - customer_requirements
 * - event_type
 * properties:
 * customer_id:
 * type: string
 * vendor_id:
 * type: string
 * service_id:
 * type: string
 * customer_name:
 * type: string
 * customer_contact_number:
 * type: string
 * event_location:
 * type: string
 * event_start:
 * type: string
 * format: date
 * event_end:
 * type: string
 * format: date
 * guest_count:
 * type: integer
 * customer_requirements:
 * type: string
 * event_type:
 * type: string
 * responses:
 * 201:
 * description: Quotation created successfully
 * 400:
 * description: Invalid input or quotation already exists
 * 404:
 * description: Customer not found
 * 500:
 * description: Server error
 */
router.post("/", (req, res) => createQuotation(req, res, io));

/**
 * @swagger
 * /quotations:
 * get:
 * summary: Get quotations by vendor ID
 * tags: [Quotations]
 * parameters:
 * - in: query
 * name: vendor_id
 * schema:
 * type: string
 * required: true
 * description: Vendor ID
 * responses:
 * 200:
 * description: Quotations retrieved successfully
 * 400:
 * description: Vendor ID is required
 * 404:
 * description: No quotations found
 * 500:
 * description: Server error
 */
router.get("/", getQuotationsByVendorId);

/**
 * @swagger
 * /quotations/all:
 * get:
 * summary: Get all quotations
 * tags: [Quotations]
 * responses:
 * 200:
 * description: All quotations retrieved successfully
 * 404:
 * description: No quotations found
 * 500:
 * description: Server error
 */
router.get("/all", getAllQuotations);

/**
 * @swagger
 * /quotations:
 * patch:
 * summary: Update quotation status
 * tags: [Quotations]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - quotation_id
 * - quote_status
 * properties:
 * quotation_id:
 * type: string
 * quote_status:
 * type: string
 * enum: [Pending, Accepted, Rejected]
 * responses:
 * 200:
 * description: Quotation updated successfully
 * 404:
 * description: Quotation not found
 * 500:
 * description: Server error
 */
router.patch("/", updateQuotationStatus);

/**
 * @swagger
 * /quotations/myquotations:
 * get:
 * summary: Get quotations for logged-in user
 * tags: [Quotations]
 * responses:
 * 200:
 * description: Quotations retrieved successfully
 * 500:
 * description: Server error
 */
router.route("/myquotations").get(getQuotations);

/**
 * @swagger
 * /quotations/{id}:
 * get:
 * summary: Get a specific quotation by ID
 * tags: [Quotations]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: Quotation ID
 * responses:
 * 200:
 * description: Quotation retrieved successfully
 * 404:
 * description: Quotation not found
 * 500:
 * description: Server error
 */
router.get("/:id", getQuotationById);

// router.get("/", async (req, res) => {
//   try {
//     const { vendor_id } = req.query;

//     if (!vendor_id) {
//       return res.status(400).json({ message: "vendor_id is required" });
//     }

//     const quotations = await Quotation.find({ vendor_id });

//     if (quotations.length === 0) {
//       return res
//         .status(404)
//         .json({ message: `No quotations found for vendor_id: ${vendor_id}` });
//     }

//     res.status(200).json({
//       message: "Quotations retrieved successfully!",
//       data: quotations,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error retrieving quotations",
//       error: error.message,
//     });
//   }
// });

router.delete("/:quotation_id", deleteQuotation);

return router;
}