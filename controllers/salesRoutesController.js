import Sales from "../models/salesExecutive.js";

/**
 * Controller: Authenticate sales user
 */
export const authenticateSalesUser = async (req, res) => {
  const { user_name, password } = req.body;

  // Input validation
  if (!user_name || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  try {
    // Find the user by username
    const user = await Sales.findOne({ user_name });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ Here you can add password validation later (bcrypt compare, etc.)
    return res.status(200).json({
      success: true,
      message: "Sales user authenticated successfully",
      user,
    });
  } catch (err) {
    console.error("Error authenticating sales user:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
