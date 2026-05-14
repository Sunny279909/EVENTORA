const authService = require("../services/authService");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
} = require("../validators/authValidator");

// ================== REGISTER ==================
exports.register = async (req, res, next) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const result = await authService.registerUser(req.body);

    res.status(201).json({
      message: "OTP sent to email. Please verify",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

// ================== LOGIN ==================
exports.login = async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const result = await authService.loginUser(req.body);

    if (result.needsVerification) {
      return res.status(403).json({
        message: "Account not verified",
        ...result,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ================== VERIFY OTP ==================
exports.verifyOTP = async (req, res, next) => {
  try {
    const { error } = verifyOTPSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const result = await authService.verifyUserOTP(req.body);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ================== REFRESH TOKEN ==================
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token required", 400);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token", 401);
    }

    const newAccessToken = authService.generateAccessToken(user.id, user.role);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};
