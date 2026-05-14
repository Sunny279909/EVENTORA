const rateLimit = require("express-rate-limit");

// 🔥 General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests
  message: { message: "Too many requests, try later" },
});

// 🔥 OTP limiter (important)
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // only 5 requests
  message: { message: "Too many OTP requests, try later" },
});

// 🔥 Login limiter
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts, try later" },
});

module.exports = { apiLimiter, otpLimiter, loginLimiter };
