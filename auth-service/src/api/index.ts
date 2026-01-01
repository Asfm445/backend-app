import mongoose from "mongoose";
import { app } from "./app";

const PORT = process.env.PORT || 4001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/backend-app";

const start = async () => {
    try {
        if (!process.env.JWT_ACCESS_SECRET) {
            console.warn("WARNING: JWT_ACCESS_SECRET is not defined!");
        }

        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`Auth Service listening on port ${PORT}`);
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
