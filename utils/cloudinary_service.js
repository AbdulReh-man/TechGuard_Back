import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
// Configuration
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.cloud_api_key,
  api_secret: process.env.cloud_api_secret,
});

const uploadoncloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return;
    const reponse = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });
    //file has been uploaded successfully
    console.log("file is uploaded on cloudinary", reponse);
    fs.unlinkSync(localfilepath);
    return reponse;
  } catch (error) {
    fs.unlinkSync(localfilepath); //remove the locally saved temporary file as the upload operation got faild
    console.log(error);
    return null;
  }
};

export { uploadoncloudinary };
