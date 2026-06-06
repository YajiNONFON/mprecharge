import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const storageService = {
  upload: async (filePath: string, folder: string): Promise<string> => {
    try {
      const result = await cloudinary.uploader.upload(filePath, { folder });

      // Supprimer le fichier temporaire après upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return result.secure_url;
    } catch (error: any) {
      // Nettoyer le fichier temporaire même en cas d'erreur
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Échec de l'upload: ${error.message}`);
    }
  },

  delete: async (publicId: string): Promise<void> => {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      throw new Error(`Échec de la suppression: ${error.message}`);
    }
  },

  extractPublicId: (url: string): string => {
    // Ex: https://res.cloudinary.com/cloud/image/upload/v123/mpay_promos/filename.jpg
    // → mpay_promos/filename
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
    if (!matches || !matches[1]) {
      throw new Error(`Impossible d'extraire le publicId depuis l'URL: ${url}`);
    }
    return matches[1];
  },
};
