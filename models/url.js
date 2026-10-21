import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  clickCount: {
      type: Number,
      default: 0,
    },

    // Information about individual visits
    clicks: [
      {
        clickedAt: {
          type: Date,
          default: Date.now,
        },

        browser: {
          type: String,
          default: "Unknown",
        },

        device: {
          type: String,
          default: "Unknown",
        },
      },
    ],
  },
  { timestamps: true }
);

const Url = mongoose.model("Url", urlSchema);

export default Url;
