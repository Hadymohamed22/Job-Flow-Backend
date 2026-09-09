import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

const connectDB = () => {
  if (!connectionPromise) {
    const uri = process.env.DB_URL;

    if (!uri) {
      throw new Error("DB_URL is not set");
    }

    connectionPromise = mongoose.connect(uri, { family: 4 }).catch((error) => {
      connectionPromise = null;
      throw error;
    });

    connectionPromise.then(() => {
      console.log("MongoDB Connected Successfully :)");
    });
  }

  return connectionPromise;
};

export default connectDB;
