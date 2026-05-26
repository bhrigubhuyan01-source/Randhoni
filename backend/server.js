const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const mealsRoutes = require("./routes/meals");

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/meals", mealsRoutes);

// --- Health Check ---
app.get("/", (req, res) => {
  res.send("Randhoni Backend Running ✅");
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
