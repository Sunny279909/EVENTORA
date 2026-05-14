const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyOTP,
  refreshToken,
} = require("../controllers/authController");

const { loginLimiter, otpLimiter } = require("../middleware/rateLimit");

router.post("/register", otpLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/verify-otp", otpLimiter, verifyOTP);
router.post("/refresh", refreshToken);

module.exports = router;
