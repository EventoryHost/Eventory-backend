import { Customer } from "../models/customer.js";

export const addCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const customer = await Customer.create({
      name,
      phone : "+91" + phone,
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
        const customer = await Customer.findOne({ phone: phone });
        res.status(200).json(customer);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};