const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
});

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
  try {
    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: userEmail,
      subject: `Booking Confirmed: ${eventTitle}`,
      html: `<p>Hi ${userName},</p>
                <p>Your booking for "${eventTitle}" is confirmed.</p>
                <p>Thanks for using Eventora.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", userEmail);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendOTPEmail = async (userEmail, otp, type) => {
  try {
    const title =
      type === "account_verification"
        ? "Verify your Eventora Account"
        : "Eventora Booking Verification";

    const msg =
      type === "account_verification"
        ? "Use this OTP to verify your account."
        : "Use this OTP to confirm your booking.";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: title,
      html: `
                <p>${msg}</p>
                <h2>${otp}</h2>
                <p>This code expires in 5 minutes.</p>
            `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${userEmail} for ${type}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

module.exports = { sendBookingEmail, sendOTPEmail };
