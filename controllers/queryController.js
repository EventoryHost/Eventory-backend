import Query from "../models/query.js";
import reactoutQuery from "../models/reachoutquery.js";
const createQuery = async (req, res) => {
  try {
    const { fullName, email, message, services, city } = req.body;

    const query = new Query({
      fullname: fullName,
      email,
      services,
      city,
      message,
    });

    const newQuery = await query.save();

    if (!newQuery)
      return res.status(500).json({ error: "Error While Createing Quary" });
    // console.log(newQuery)
    return res.status(200).json(newQuery);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createreachoutQuery = async (req, res) => {
  try {
    const { fullName, mobileno, message } = req.body;

    const query = new reactoutQuery({
      fullName,
      mobileno,
      message,
    });

    const newQuery = await query.save();

    if (!newQuery)
      return res.status(500).json({ error: "Error While Createing Quary" });
    // console.log(newQuery)
    return res.status(200).json(newQuery);
  } catch (error) {
    // console.log(error)
    return res.status(500).json({ error: error.message });
  }
};

export default { createQuery, createreachoutQuery };
