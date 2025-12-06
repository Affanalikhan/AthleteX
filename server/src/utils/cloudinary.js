import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import logger from './logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {string} folder - Folder in Cloudinary to store the file
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadToCloudinary = async (filePath, folder = 'athletex') => {
  try {
    if (!filePath) {
      throw new Error('No file path provided');
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      use_filename: true,
      unique_filename: true,
      resource_type: 'auto',
    });

    // Delete the temporary file
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    // Delete the temporary file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    logger.error(`Error uploading to Cloudinary: ${error.message}`);
    throw new Error('Error uploading file to Cloudinary');
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise<Object>} - Cloudinary delete result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('No public ID provided');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error(`Error deleting from Cloudinary: ${error.message}`);
    throw new Error('Error deleting file from Cloudinary');
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array<string>} filePaths - Array of file paths to upload
 * @param {string} folder - Folder in Cloudinary to store the files
 * @returns {Promise<Array<Object>>} - Array of Cloudinary upload results
 */
export const uploadMultipleToCloudinary = async (filePaths, folder = 'athletex') => {
  try {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      throw new Error('No files provided');
    }

    const uploadPromises = filePaths.map((filePath) =>
      uploadToCloudinary(filePath, folder)
    );

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    logger.error(`Error uploading multiple files to Cloudinary: ${error.message}`);
    throw new Error('Error uploading files to Cloudinary');
  }
};

export default cloudinary;
