import { Caterer } from "../models/caterer.js";
import { Customer } from "../models/customer.js";
import Photographer from "../models/photographers.js";
import { Decorator } from "../models/decoraters.js";
import PropRental from "../models/props.js";
import MakeupArtist from "../models/makeupArtists.js";
import jwt from "jsonwebtoken";
import { Venue } from "../models/venue.js";

export const addCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const customer = await Customer.create({
      name,
      phone: "+91" + phone,
      quotations: [],
    });
    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const { phone } = req.body;
    if (phone && !phone.startsWith("+91")) {
      phone = "+91" + phone;
    }
    const customer = await Customer.findOne({ mobile: phone });
    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getBooking = async (req, res) => {
  try {
    const serviceId = req.params.serId;
    const customerId = req.params.cusId;
    const booking = await Customer.findOne({
      id: customerId,
      quotations: { $elemMatch: { serviceId: serviceId } },
    });
    if (!booking) {
      return res.status(404).json({ message: "No bookings found" });
    }
    res.status(200).json(booking);
  } catch {
    res.status(400).json({ message: error.message });
  }
};

export const addFavourite = async (req, res) => {
  try {
    const serviceId = req.params.serId;
    const customerId = req.params.cusId;
    const customer = await Customer.findOne({ id: customerId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (!customer.favoriteServices) {
      customer.favoriteServices = [];
    }
    if (customer.favoriteServices.includes(serviceId)) {
      return res
        .status(400)
        .json({ message: "Service already added to favourites" });
    }
    customer.favoriteServices.push(serviceId);
    await customer.save();
    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// export const getFavoriteServices = async (req, res) => {
//   try {
//     const customerId = req.params.cusId;
//     const customer = await Customer.findOne({ id: customerId });

//     if (!customer) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     if (!customer.favoriteServices) {
//       customer.favoriteServices = [];
//     }

//     // Array to store vendor details
//     const favoriteVendors = [];

//     // Loop through each service ID in favoriteServices
//     for (const serviceId of customer.favoriteServices) {
//       let collection;

//       if (serviceId.startsWith("cat")) {
//         collection = Caterer;
//       } else if (serviceId.startsWith("veu")) {
//         collection = Venue;
//       } else if (serviceId.startsWith("pav")) {
//         collection = Photographer;
//       } else if (serviceId.startsWith("dec")) {
//         collection = Decorator;
//       } else if (serviceId.startsWith("prop")) {
//         collection = PropRental;
//       } else if (serviceId.startsWith("mak")) {
//         collection = MakeupArtist;
//       } else {
//         console.warn(`Unknown prefix: ${serviceId}`);
//         continue; // Skip if prefix is unknown
//       }

//       // Find the vendor in the appropriate collection
//       const vendor = await collection.findOne({ id: serviceId });

//       if (vendor) {
//         console.log(vendor);
//         favoriteVendors.push(vendor);
//       } else {
//         console.warn(`Vendor not found for ID: ${serviceId}`);
//       }
//     }

//     // Return the list of favorite vendors with full details
//     res.status(200).json(favoriteVendors);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

export const getFavoriteServices = async (req, res) => {
  try {
    const customerId = req.params.cusId;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const customer = await Customer.findOne({ id: customerId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const favoriteServiceIds = customer.favoriteServices || [];

    const favoriteVendors = [];

    for (const serviceId of favoriteServiceIds) {
      let collection;

      if (serviceId.startsWith("cat")) {
        collection = Caterer;
      } else if (serviceId.startsWith("veu")) {
        collection = Venue;
      } else if (serviceId.startsWith("pav")) {
        collection = Photographer;
      } else if (serviceId.startsWith("dec")) {
        collection = Decorator;
      } else if (serviceId.startsWith("prop")) {
        collection = PropRental;
      } else if (serviceId.startsWith("mak")) {
        collection = MakeupArtist;
      } else {
        console.warn(`Unknown prefix: ${serviceId}`);
        continue;
      }

      const vendor = await collection.findOne({ id: serviceId });

      if (vendor) {
        favoriteVendors.push(vendor);
      }
    }

    // Total number of favorite vendors
    const total = favoriteVendors.length;

    // If valid page & limit provided, paginate the results
    if (!isNaN(page) && !isNaN(limit)) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedVendors = favoriteVendors.slice(startIndex, endIndex);

      return res.status(200).json({
        vendors: paginatedVendors,
        total: total,
      });
    }

    // If no pagination, return full list
    res.status(200).json(favoriteVendors);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const getFavoriteServiceIds = async (req, res) => {
  try {
    const customerId = req.params.cusId;
    const customer = await Customer.findOne({ id: customerId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (!customer.favoriteServices) {
      customer.favoriteServices = [];
    }
    res.status(200).json(customer.favoriteServices);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeFavourite = async (req, res) => {
  try {
    const serviceId = req.params.serId;
    const customerId = req.params.cusId;
    const customer = await Customer.findOne({ id: customerId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (!customer.favoriteServices) {
      customer.favoriteServices = [];
    }
    if (!customer.favoriteServices.includes(serviceId)) {
      return res
        .status(400)
        .json({ message: "Service not found in favourites" });
    }
    customer.favoriteServices = customer.favoriteServices.filter(
      (id) => id !== serviceId,
    );
    await customer.save();
    res.status(200).json(customer);
  } catch {
    res.status(400).json({ message: error.message });
  }
};

export const getCustomerByMobile = async (req, res) => {
  try {
    const mobile = req.params.mobile;
    const customer = await Customer.findOne({ mobile: mobile });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ customer });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const mobile = decoded.mobile;

    if (!mobile) return res.status(403).json({ message: "Invalid token" });

    const { mobile: mobileFromBody, ...updates } = req.body;
    if (!mobileFromBody)
      return res.status(400).json({ message: "Phone number missing" });

    const customer = await Customer.findOneAndUpdate(
      { mobile: mobileFromBody },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
