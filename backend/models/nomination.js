const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// MongoDB Connection
const mongoURI =
  process.env.MONGODB_URI ||
  "mongodb+srv://katendek64:B9UwNajzpPwBao3h@clusterawards.3yxlv.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAwards";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

// Mongoose Schema & Model
const nominationSchema = new mongoose.Schema({
  // Nominator Details
  nominatorTitle: { type: String, default: "" },
  nominatorFirstName: { type: String, required: true },
  nominatorLastName: { type: String, required: true },
  nominatorEmail: { type: String, required: true },
  nominatorPhone: { type: String, required: true },
  nominatorOrganization: { type: String, required: true },

  // Nominee Details
  nomineeTitle: { type: String, default: "" },
  nomineeFirstName: { type: String, required: true },
  nomineeLastName: { type: String, required: true },
  nomineeEmail: { type: String, required: true },
  nomineePhone: { type: String, required: true },
  nomineeOrganization: { type: String, required: true },
  nomineeAddress: { type: String, required: true },

  // Categories
  categories: { type: [String], required: true },

  // Timestamp
  submittedAt: { type: Date, default: Date.now },
});

const Nomination = mongoose.model("Nomination", nominationSchema);

// Routes
app.post("/submit-nomination", async (req, res) => {
  try {
    const nominationData = req.body;
    nominationData.categories = Array.isArray(nominationData.categories)
      ? nominationData.categories
      : JSON.parse(nominationData.categories || "[]");

    const nomination = new Nomination(nominationData);
    await nomination.save();
    res
      .status(201)
      .json({ message: "Nomination submitted successfully", nomination });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/nominations", async (req, res) => {
  try {
    const nominations = await Nomination.find().sort({ submittedAt: -1 });
    res.json(nominations);
  } catch (error) {
    console.error("Error fetching nominations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
