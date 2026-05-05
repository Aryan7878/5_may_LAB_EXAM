const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = 5000;

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/urlshortner")
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("MongoDB Error:", err);
  });

// Schema
const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true
  }
});

// Model
const Url = mongoose.model("Url", urlSchema);

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Create short URL
app.post("/shorten", async (req, res) => {
  try {
    const originalUrl = req.body.originalUrl;

    if (!originalUrl) {
      return res.status(400).json({
        message: "Please provide originalUrl"
      });
    }

    const shortCode = nanoid(6);

    const newUrl = new Url({
      originalUrl: originalUrl,
      shortCode: shortCode
    });

    await newUrl.save();

    res.json({
      message: "Short URL created successfully",
      originalUrl: originalUrl,
      shortUrl: `http://localhost:${PORT}/${shortCode}`
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
});

// Redirect route
app.get("/:shortCode", async (req, res) => {
  try {
    const shortCode = req.params.shortCode;

    const urlData = await Url.findOne({
      shortCode: shortCode
    });

    if (!urlData) {
      return res.status(404).send("Short URL not found");
    }

    res.redirect(urlData.originalUrl);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});