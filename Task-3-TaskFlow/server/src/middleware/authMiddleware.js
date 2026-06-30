import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Verifies the JWT sent in the Authorization header ("Bearer <token>"),
 * loads the associated user, and attaches it to req.user.
 * Any downstream route can then rely on req.user.id being valid.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user no longer exists",
      });
    }

    req.user = user; // full mongoose doc, password excluded by default schema option
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired, please log in again" });
    }
    return res.status(401).json({ success: false, message: "Not authorized, invalid token" });
  }
};
