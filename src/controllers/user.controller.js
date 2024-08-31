import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenRefreshToken = async (userId) => {
  try {
    const userData = await User.findById(userId);
    const accesstoken = userData.generateAccessToken();
    const refreshToken = userData.generateRefreshToken();

    userData.refreshToken = refreshToken;
    userData.save({ validateBeforeSave: false });

    return { accesstoken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while creating refresh token and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, password, fullName } = req.body;
  if (
    [userName, email, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(409, "All fields are required");
  }

  //imoprting user model and checking if curreny email or user alredy exist
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User Already Exist");
  }

  //fiole handling
  //  we are doing file handling through middleware this give us req.file as like like req.body
  //multer gives us req.files

  console.log("req files", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files?.coverImage.length > 0
  ) {
    console.log("coming here");
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  // avatar is required so putting check
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is Required");
  }

  // uploading image to cloudinary
  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
  const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarUpload) {
    throw new ApiError(400, "Avatar is Required");
  }

  const createdUser = await User.create({
    fullName,
    email,
    password,
    userName: userName.toLowerCase(),
    avatar: avatarUpload.url,
    coverImage: coverImageUpload?.url || "",
  });

  const userData = await User.findById(createdUser._id).select(
    " -password -refreshToken "
  );

  if (!userData) {
    throw new ApiError(400, "Something went wrong while creating user");
  }

  res
    .status(201)
    .json(new ApiResponse(200, userData, "User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;
  if (!(email || userName)) {
    throw new ApiError(400, "username/password is required");
  }
  console.log("userData", email, password);
  const userData = await User.findOne({ $or: [{ email }, { userName }] });
  // console.log("userData", userData)

  if (!userData) {
    throw new ApiError(404, "username/password is incorrect");
  }

  const isPasswordValid = await userData.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password is incorrect");
  }

  const { accesstoken, refreshToken } = await generateAccessTokenRefreshToken(
    userData._id
  );

  console.log("accesstoken", accesstoken);
  console.log("refreshToken", refreshToken);

  const loggedINUser = await User.findById(userData._id).select(
    " -password -refreshToken"
  );

  console.log("loggedINUser", loggedINUser);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accesstoken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedINUser,
          refreshToken: refreshToken,
          accesstoken: accesstoken,
        },
        "USER LOGGED IN sUCCESSFULLY"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userDetails = req.user;
  const data = await User.findByIdAndUpdate(
    userDetails._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
console.log("logging out data", data)

const options = {
  httpOnly: true,
  secure: true
}
  return res
    .status(200)
    .clearCookie("accesToken", options)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user Loggedout SuceessFully"));
});

export { registerUser, loginUser, logoutUser };
