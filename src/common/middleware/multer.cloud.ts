import multer from "multer";
import { multer_enum, Store_Enum } from "../enum/multer.enum";
import { tmpdir } from "node:os";
import { Request } from "express";

const multerCloud = ({
  store_type = Store_Enum.memory,
  custom_types = multer_enum.image,
  maxFileSize = 5 * 1024 * 1024,
}: {
  store_type?: Store_Enum;
  custom_types?: string[];
  maxFileSize?: number;
} = {}) => {
  const storage =
    store_type === Store_Enum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: tmpdir(),
          filename: function (
            req: Request,
            file: Express.Multer.File,
            callback: Function,
          ) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            callback(null, file.fieldname + "-" + uniqueSuffix + ".png");
          },
        });

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    callback: Function,
  ) {
    if (!custom_types.includes(file.mimetype)) {
      callback(new Error("Invalid File type"));
    }
    callback(null, true);
  }
  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSize },
  });
  return upload;
};

export default multerCloud;
