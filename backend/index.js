require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static("uploads")); // Serve uploaded files statically

// MongoDB Connection
const mongoURI =
  "mongodb+srv://katendek64:B9UwNajzpPwBao3h@clusterawards.3yxlv.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAwards";
mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store files in 'uploads/' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// Multer file filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("application/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// Multer upload middleware
const upload = multer({ storage, fileFilter });

// Mongoose Schema
const nominationSchema = new mongoose.Schema({
  nominatorTitle: { type: String, default: "" },
  nominatorFirstName: { type: String, required: true },
  nominatorLastName: { type: String, required: true },
  nominatorEmail: { type: String, required: true },
  nominatorPhone: { type: String, required: true },
  nominatorOrganization: { type: String, required: true },

  nomineeTitle: { type: String, default: "" },
  nomineeFirstName: { type: String, required: true },
  nomineeLastName: { type: String, required: true },
  nomineeEmail: { type: String, required: true },
  nomineePhone: { type: String, required: true },
  nomineeOrganization: { type: String, required: true },
  nomineeAddress: { type: String, required: true },

  categories: { type: [String], required: true },

  videoLink: { type: String, default: "" },
  otherLinks: { type: String, default: "" },
  file: { type: String, default: "" },
  image: { type: String, default: "" },

  submittedAt: { type: Date, default: Date.now },
});

const Nomination = mongoose.model("Nomination", nominationSchema);

// Endpoint to submit a nomination (with file upload)
app.post(
  "/submit-nomination",
  upload.fields([{ name: "file" }, { name: "image" }]),
  async (req, res) => {
    console.log(req.body);
    try {
      const {
        nominatorTitle,
        nominatorFirstName,
        nominatorLastName,
        nominatorEmail,
        nominatorPhone,
        nominatorOrganization,

        nomineeTitle,
        nomineeFirstName,
        nomineeLastName,
        nomineeEmail,
        nomineePhone,
        nomineeOrganization,
        nomineeAddress,

        categories,
        videoLink,
        otherLinks,
      } = req.body;

      const parsedCategories = JSON.parse(categories || "[]");

      const nomination = new Nomination({
        nominatorTitle: nominatorTitle || "",
        nominatorFirstName,
        nominatorLastName,
        nominatorEmail,
        nominatorPhone,
        nominatorOrganization,

        nomineeTitle: nomineeTitle || "",
        nomineeFirstName,
        nomineeLastName,
        nomineeEmail,
        nomineePhone,
        nomineeOrganization,
        nomineeAddress,

        categories: Array.isArray(parsedCategories) ? parsedCategories : [],
        videoLink,
        otherLinks,
        file: req.files["file"] ? req.files["file"][0].path : "",
        image: req.files["image"] ? req.files["image"][0].path : "",
      });

      await nomination.save();
      res.status(201).json({ message: "Nomination submitted successfully" });
    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        }));
        return res.status(400).json({ errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Endpoint to get all nominations
app.get("/nominations", async (req, res) => {
  try {
    const nominations = await Nomination.find().sort({ submittedAt: -1 });
    res.json(nominations);
  } catch (error) {
    console.error("Error fetching nominations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
