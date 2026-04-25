const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
//ROUTES
app.use("/api/auth", authRoutes);
mongoose
  .connect(process.env.MONGO_URI)
  .then((conn) => {
    console.log(`MongoDB Connected`);
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port${PORT}`);
});
