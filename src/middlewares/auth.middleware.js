import { User } from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  const token =
    req?.cookies?.accessToken ||
    req?.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(400, "Unauthorized Request");
  }
  console.log("token", token);

  const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  console.log("decoded token", decodedToken);

  const userData = await User.findById(decodedToken._id);
  console.log("logging out user data ", decodedToken);

  if (!userData) {
    throw new ApiError(400, "Something went wrong while getting user details");
  }

  req.user = userData;
  next();
});
