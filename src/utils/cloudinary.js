import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {
   
    
  try {
    
    if (!localFilePath) return null;
   
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw", 
      folder: "pdf_uploads",
      
    });
  
    await fs.unlinkSync(localFilePath);
    return response;
  } 
  catch (error) {
    console.log("hello",localFilePath);
    
    return null;
  }
};

export { uploadOnCloudinary };