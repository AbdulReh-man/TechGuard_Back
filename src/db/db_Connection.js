import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `MongoDB Connected to ${connectionInstance.connection.host} database`
    );
  } catch (error) {
    console.error("Error connecting to database: ", error);
  }
};
export default connectDB;
