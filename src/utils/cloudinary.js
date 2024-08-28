import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // if not localpath send null

    // uploader.upload tkes 2 params file path and specifications
    const cloudinaryResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // console.log("Succesfull uploaded response", cloudinaryResponse.url);
    fs.unlinkSync(localFilePath);
    return cloudinaryResponse;
  } catch (error) {
    // if upload fails unlinking file fs is filesystem of node availabele inbuilt
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export{uploadOnCloudinary}