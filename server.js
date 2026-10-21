
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import urlRoutes from "./routes/urlRoutes.js";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Register URL creation and redirect routes
app.use(urlRoutes);


app.get("/api/debug/routes", (req, res) => {
  res.status(200).json({
    service: "AI URL Shortener",
    routes: [
      "POST /api/urls",
      "GET /r/:shortCode",
      "GET /api/urls/:shortCode/analytics",
    ],
  });
});


// Home route: check whether the server is running
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI URL Shortener backend is running!",
  });
});

// Health check: check server and database status
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    server: "running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Connect to MongoDB before starting the server
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from the .env file."
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(
        `Server running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
