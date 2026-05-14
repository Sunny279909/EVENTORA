const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const bookingRoutes = require("./routes/booking");
const errorMiddleware = require("./middleware/errorMiddleware");
const { apiLimiter } = require("./middleware/rateLimit");

dotenv.config();

const app = express();
app.use(cors());
app.use("/api", apiLimiter);
app.use(express.json());

// Testing route
app.get("/api/test", (req, res) => {
  res.json({
    status: "OK",
    message: "Test route is working",
    timestamp: new Date(),
  });
});

//ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
mongoose
  .connect(process.env.MONGO_URI)
  .then((conn) => {
    console.log(`MongoDB Connected`);
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
    process.exit(1);
  });
console.log("AUTO DEPLOY TEST");
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(errorMiddleware);
