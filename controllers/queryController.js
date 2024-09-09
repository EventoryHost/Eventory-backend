import Query from "../models/query.js";

const createQuery = async (req, res) => {
  try {
    const { fullname, email, message } = req.body;

    const query = new Query({
      fullname,
      email,
      services,
      city,
      message,
    });

    const newQuery = await query.save();
    return res.status(200).json(newQuery);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { createQuery };
