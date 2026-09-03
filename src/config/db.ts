import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.DB_URL;

  if (!uri) {
    throw new Error("DB_URI (or DB_URL) is not set");
  }
  try {
    await mongoose.connect(uri, { family: 4 });
    console.log("MongoDB Connected Successfully :)");
  } catch (error) {
    console.error("Failed to connect to MongoDB :", (error as Error).message);
    process.exit(1);
  }
};

export default connectDB;
