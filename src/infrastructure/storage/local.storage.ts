import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const localStorageService = {
  upload: async (filePath: string, folder: string): Promise<string> => {
    const filename = path.basename(filePath);
    const dest = path.join(UPLOAD_DIR, folder, filename);

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(filePath, dest);
    fs.unlinkSync(filePath);

    return `/uploads/${folder}/${filename}`;
  },

  delete: async (filePath: string): Promise<void> => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },
};
