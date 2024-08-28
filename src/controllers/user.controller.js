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
  if (!email || !userName) {
    throw new ApiError(400, "username/password is required");
  }

  const userData = await User.findOne({ $or: [{ email }, { userName }] });

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

  const loggedINUser = User.findById(userData._id).select(
    "-password, -refreshtoken"
  );

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
          refreshToken,
          accesstoken,
        },
        "USER LOGGED IN sUCCESSFULLY"
      )
    );
});

export { registerUser };
