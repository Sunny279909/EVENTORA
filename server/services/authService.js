const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("../utils/email");
const AppError = require("../utils/AppError");

// 🔐 Token generators
const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// 🔢 OTP generator
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ================== REGISTER ==================
exports.registerUser = async ({ name, email, password, role }) => {
  let user = await User.findOne({ email });
  if (user) throw new AppError("User already exists", 400);

  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || "user",
    isVerified: false,
  });

  const otp = generateOTP();
  await OTP.create({ email, otp, action: "account_verification" });
  await sendOTPEmail(email, otp, "account_verification");

  return { email: user.email };
};

// ================== LOGIN ==================
exports.loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("Invalid credentials", 400);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 400);

  // If not verified
  if (!user.isVerified && user.role !== "admin") {
    const otp = generateOTP();

    await OTP.findOneAndDelete({
      email: user.email,
      action: "account_verification",
    });

    await OTP.create({
      email: user.email,
      otp,
      action: "account_verification",
    });

    await sendOTPEmail(user.email, otp, "account_verification");

    return {
      needsVerification: true,
      email: user.email,
    };
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
  };
};

// ================== VERIFY OTP ==================
exports.verifyUserOTP = async ({ email, otp }) => {
  const validOTP = await OTP.findOne({
    email,
    otp,
    action: "account_verification",
  });

  if (!validOTP) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  const user = await User.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true },
  );

  await OTP.deleteOne({ _id: validOTP._id });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
  };
};

// export token generator for controller
exports.generateAccessToken = generateAccessToken;
