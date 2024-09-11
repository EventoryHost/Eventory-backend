import Query from "../models/query.js";

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

    if (!newQuery) return res.status(500).json({ error: "Error While Createing Quary" });
    // console.log(newQuery)
    return res.status(200).json(newQuery);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { createQuery };
