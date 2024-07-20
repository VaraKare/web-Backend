import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler ( async (req, res) => {
   // get user details from front-end
   //validation {empty username, empty email and moree} , a seperate folder and import methods here
   // check if user already exists by- username, email.
   // check for images, check for avatart
   // upload them to cloudnary, check if uploaded.
   // check multer works or not
   // create user object - create entry in db 
   // remove password, refresh token from response
   // check for user creation
   // return response to user

   const {fullName, email, username, password} = req.body
    console.log("email: ", email);

    /*if(fullName === ""){
        throw new ApiError(400, "Fullname required")
     }  or
     */

    if (
        [fullName, email, username, password].some((fieldItem)=> fieldItem?.trim() === "")
        )
    {
        throw new ApiError(400, "This fieldItem required")
    }

    const existedUser = User.findOne({
        $or : [{ username },{ email }]
    })

    if (existedUser){
        throw new ApiError(409, "credintials matched try new credintials")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "Something Went Wrong while registering")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered succesfully")
    )

});

export { 
    registerUser,
 }