import { Customer } from "../models/customer.js";

export const addCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const customer = await Customer.create({
      name,
      phone: "+91" + phone,
      bookings: [],
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
      bookings: { $elemMatch: { serviceId: serviceId } },
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

export const getFavoriteServices = async (req, res) => {
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
    const phone = req.params.phone;
    const customer = await Customer.findOne({ mobile: phone });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ customer });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
