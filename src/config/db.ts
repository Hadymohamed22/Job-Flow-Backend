import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  const uri = process.env.DB_URL;

  if (!uri) {
    throw new Error("DB_URL is not set");
  }

  try {
    await mongoose.connect(uri, { family: 4 });
    isConnected = true;
    console.log("MongoDB Connected Successfully :)");
  } catch (error) {
    console.error("Failed to connect to MongoDB :", (error as Error).message);
    throw error;
  }
};

export default connectDB;
