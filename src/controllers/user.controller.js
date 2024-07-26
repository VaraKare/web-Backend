import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
    } catch(error){
        throw new ApiError(500 , "something went wronggg while generating Access and Refresh Tokens")
    }
 }

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
    // console.log("email: ", email);

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

    const existedUser = await User.findOne({
        $or : [{ username },{ email }]
    })

    if (existedUser){
        throw new ApiError(409, "credintials matched try new credintials")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    } 

    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required local")
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

const loginUser = asyncHandler ( async (req, res) => {
 /** TO DO
  * take data from req body
  * username/ email base give access or both
  * find user alredy exist
  * if yes check password
  * if wrong throw messege
  * if correct assign him access and refresh token
  * send the token via cookies
  * login successful message
  */
 
 

 const {email, username, password} = req.body
 if ((!username && !email)){
    throw new ApiError (400, " email and password is required")
 }
 //find user alredy exist in database
 const user = await User.findOne(
    {
        $or : [{username}, {email}]
    }
 )
 // if user's data is not availabel
 if(!user) {
    throw new ApiError(404, "User does not exist")
 }

 const isPasswordValid = await user.isPasswordCorrect(password)
 if(!isPasswordValid) {
    throw new ApiError(401, "Incorrect password")
 }
 const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

 const loggedInUser = await User.findOne(user._id).select ( "-password -refreshToken" )

 const options = {
    httpOnly : true,
    secure : true
 }

 return res.status(200)
 .cookie("accessToken",accessToken, options)
 .cookie("refreshToken",refreshToken, options)
 .json(
    new ApiResponse (200, {
        user: loggedInUser,accessToken,refreshToken
    },
    "user loggedIn successfully")
 ) // give user his details
});
 
const logoutUser = asyncHandler (async (req, res) => {
    await User.findByIdAndUpdate(
     req.user._id,
    {
    $set : {
        refreshToken: undefined
    }
    },{
        new : true
    }
)
const options = {
    httpOnly : true,
    secure : true
 }

 return res
 .status(200)
 .clearCookie("accessToken",options)
 .clearCookie("refreshToken",options)
 .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
   const incommingRefreshToken= req.cookies.refreshToken || req.body.refreshToken

   if(!incommingRefreshToken){
    throw new ApiError(401, "Unauthorised request")
   }
   
   try {
    const decodedToken = jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
    const user =await  User.findById(decodedToken?._id)
 
    if(!user){
     throw new ApiError(401, "Invalid refresh token")
    }
 
    if(incommingRefreshToken !== user?.refreshToken){
     throw new ApiError(401, " User token is expired or used")
    }
 
    const options = {
     httpOnly: true,
     secure : true
    }
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
     new ApiResponse(
         200,
         {
             accessToken,
             refreshToken: newRefreshToken
         },
         "Access Token Refreshed"
     )
    )
   } catch (error) {
    throw new ApiError(401 , error?.message || "invalid refresh token")
   }
})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError (400, "oldPassword is not valid")
    }

    user.password = newPassword
    user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user , "current user fetched Successfully"))
})

const updateAccountDetails = asyncHandler (async (req, res) => {
    const { fullName, email } = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user =  User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                email
            }
        },
        {
            new : true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async (req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError (400, "Avatar File is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Error while UPloading on Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
           $set: {
                avatar : avatar.url,
            } // we are taking url from object in cloudinary and updating to avatar of DB
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError (400, "CoverImage File is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "Error while UPloading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
           $set: {
            coverImage : coverImage.url,
            } // we are taking url from object in cloudinary and updating to coverImage of DB
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
 }