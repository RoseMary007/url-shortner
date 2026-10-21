
import express from "express";
import { randomBytes } from "crypto";
import Url from "../models/url.js";

const router = express.Router();

// POST: Create a short URL
router.post("/api/urls", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    // Check whether the user supplied a URL
    if (!originalUrl || typeof originalUrl !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide an originalUrl as a string.",
      });
    }

    // Validate the URL
    let parsedUrl;

    try {
      parsedUrl = new URL(originalUrl.trim());
    } catch {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid URL.",
      });
    }

    // Allow only HTTP and HTTPS
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: "Only HTTP and HTTPS URLs are allowed.",
      });
    }

    // Generate a random short code
    const shortCode = randomBytes(6).toString("base64url");

    // Save the URL in MongoDB
    const newUrl = await Url.create({
      originalUrl: parsedUrl.href,
      shortCode,
    });

    // Build the short link
    const baseUrl = (
  process.env.BASE_URL ||
  `${req.protocol}://${req.get("host")}`
).replace(/\/$/, "");

const shortUrl = `${baseUrl}/r/${shortCode}`;
    return res.status(201).json({
      success: true,
      message: "Short URL created successfully",
      data: {
        originalUrl: newUrl.originalUrl,
        shortCode: newUrl.shortCode,
        shortUrl,
        createdAt: newUrl.createdAt,
      },
    });
  } catch (error) {
    console.error("Create URL error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create short URL.",
    });
  }
});

// GET: Redirect to the original URL

router.get("/r/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Find the saved URL
    const urlRecord = await Url.findOne({ shortCode });

    if (!urlRecord) {
      return res.status(404).json({
        success: false,
        message: "Short URL not found.",
      });
    }

    // Read browser and device information from the request
    const userAgent = req.get("user-agent") || "";

    let browser = "Unknown";

    if (userAgent.includes("Edg/")) {
      browser = "Edge";
    } else if (userAgent.includes("Firefox/")) {
      browser = "Firefox";
    } else if (userAgent.includes("Chrome/")) {
      browser = "Chrome";
    } else if (userAgent.includes("Safari/")) {
      browser = "Safari";
    }

    let device = "Desktop";

    if (/tablet|ipad/i.test(userAgent)) {
      device = "Tablet";
    } else if (/mobile|iphone|android/i.test(userAgent)) {
      device = "Mobile";
    }

    // Record this visit and increment the counter
    await Url.updateOne(
      { _id: urlRecord._id },
      {
        $inc: { clickCount: 1 },
        $push: {
          clicks: {
            clickedAt: new Date(),
            browser,
            device,
          },
        },
      }
    );

    // Redirect the visitor to the destination
    return res.redirect(302, urlRecord.originalUrl);
  } catch (error) {
    console.error("Redirect error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to redirect.",
    });
  }
});

 // GET: View analytics for a short URL
router.get("/api/urls/:shortCode/analytics", async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Find the URL and its saved click information
    const urlRecord = await Url.findOne({ shortCode });

    if (!urlRecord) {
      return res.status(404).json({
        success: false,
        message: "Short URL not found.",
      });
    }

    // Return the analytics
    return res.status(200).json({
      success: true,
      data: {
        originalUrl: urlRecord.originalUrl,
        shortCode: urlRecord.shortCode,
        shortUrl: `${(
  process.env.BASE_URL ||
  `${req.protocol}://${req.get("host")}`
).replace(/\/$/, "")}/r/${urlRecord.shortCode}`,
        totalClicks: urlRecord.clickCount,
        clicks: urlRecord.clicks,
        createdAt: urlRecord.createdAt,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve URL analytics.",
    });
  }
});

export default router;
