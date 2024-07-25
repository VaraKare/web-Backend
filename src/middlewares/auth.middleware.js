// created middleware
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log("Received token:", token);
        if(!token){
            throw new ApiError(401,"Unauthoriseddd Request")
        }
    
        const decodeToken =  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "invalid Access Token")
        }
        
        req.user = user;
        next()
    } catch (error) {
        console.error(error);
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})