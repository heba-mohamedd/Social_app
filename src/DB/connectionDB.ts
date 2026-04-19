import mongoose from "mongoose";
import { MONGO_DB } from "../config/config.service";

const checkConnectionDB = async () => {
  await mongoose
    .connect(MONGO_DB, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log("DataBase connected Successfully");
    })
    .catch((error) => {
      console.log(error, "DB fail to connected ...");
    });
};

export default checkConnectionDB;
