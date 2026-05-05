const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
require("dotenv").config();

const Url = require("./models/Url");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err.message));

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const formatUrl = (url) => ({
  originalUrl: url.originalUrl,
  shortUrl: `${BASE_URL}/${url.shortCode}`,
  shortCode: url.shortCode,
  clicks: url.clicks
});

app.post("/shorten", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ message: "originalUrl is required" });
    }

    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    let url = await Url.findOne({ originalUrl });

    if (!url) {
      url = await Url.create({
        originalUrl,
        shortCode: nanoid(7)
      });
    }

    res.json(formatUrl(url));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get("/api/url/:shortCode", async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });

    if (!url) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    res.json({
      ...formatUrl(url),
      createdAt: url.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get("/:shortCode", async (req, res) => {
  try {
    const url = await Url.findOneAndUpdate(
      { shortCode: req.params.shortCode },
      { $inc: { clicks: 1 } }
    );

    if (!url) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    res.redirect(url.originalUrl);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at ${BASE_URL}`);
});