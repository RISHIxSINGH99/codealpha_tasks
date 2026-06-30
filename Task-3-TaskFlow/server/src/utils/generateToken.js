import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT containing only the user's ID.
 * Keeping the payload minimal avoids stale data being carried
 * in the token if the user's profile changes later.
 */
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export default generateToken;
