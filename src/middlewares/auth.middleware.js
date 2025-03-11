import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Dealer } from "../models/dealer.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const dealer = await Dealer.findById(decodedToken?._id).select("-password");

        if (!dealer) {
            throw new ApiError(401, "Invalid Token");
        }

        req.dealer = dealer;
        
        
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid token");
    }
});