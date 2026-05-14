const Booking = require("../models/Booking");
const Event = require("../models/Event");
const OTP = require("../models/OTP");
const { sendBookingEmail, sendOTPEmail } = require("../utils/email");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
const emailQueue = require("../queues/emailQueue");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.sendBookingOTP = async (req, res, next) => {
  try {
    const otp = generateOTP();
    await OTP.findOneAndDelete({
      email: req.user.email,
      action: "event_booking",
    });
    await OTP.create({ email: req.user.email, otp, action: "event_booking" });
    await sendOTPEmail(req.user.email, otp, "event_booking");
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    next(error);
  }
};

exports.bookEvent = async (req, res, next) => {
  try {
    const { eventId, otp } = req.body;

    // Verify OTP explicitly before proceeding
    const validOTP = await OTP.findOne({
      email: req.user.email,
      otp,
      action: "event_booking",
    });
    if (!validOTP) throw new AppError("Invalid or expired OTP", 400);

    const event = await Event.findById(eventId);
    if (!event) throw new AppError("Event not found", 404);

    const existingBooking = await Booking.findOne({
      userId: req.user.id,
      eventId,
    });
    if (existingBooking && existingBooking.status !== "cancelled") {
      throw new AppError("Already booked or pending", 400);
    }

    const booking = await Booking.create({
      userId: req.user.id,
      eventId,
      status: "pending",
      paymentStatus: "not_paid",
      amount: event.ticketPrice,
    });

    await OTP.deleteOne({ _id: validOTP._id });

    res.status(201).json({ message: "Booking request submitted", booking });
  } catch (error) {
    next(error);
  }
};

exports.confirmBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { paymentStatus } = req.body; // 'paid' or 'not_paid'
    const booking = await Booking.findById(req.params.id)
      .populate("userId")
      .populate("eventId")
      .session(session);
    if (!booking) throw new AppError("Booking not found", 404);

    if (booking.status === "confirmed")
      throw new AppError("Booking is already confirmed", 400);

    const updatedEvent = await Event.findOneAndUpdate(
      { _id: booking.eventId._id, availableSeats: { $gt: 0 } },
      { $inc: { availableSeats: -1 } },
      { new: true },
    ).session(session);
    if (!updatedEvent) {
      throw new AppError("No seats available to confirm", 400);
    }
    if (paymentStatus === "fail") {
      throw new Error("Force failure");
    }
    booking.status = "confirmed";
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();
    console.log("📥 Adding email job to queue...");
    // Send email on admin confirmation
    if (emailQueue) {
      await emailQueue.add("sendBookingEmail", {
        email: booking.userId.email,
        name: booking.userId.name,
        eventTitle: booking.eventId.title,
      });
    }
    console.log("✅ Job added to queue");

    res.json({ message: "Booking confirmed successfully", booking });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = req.user.role === "admin" ? {} : { userId: req.user.id };

    const bookings = await Booking.find(query)
      .populate("eventId")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      page,
      limit,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new AppError("Booking not found", 404);
    if (
      booking.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      throw new AppError("Not authorized", 403);
    }
    if (booking.status === "cancelled")
      throw new AppError("Already cancelled", 400);

    const wasConfirmed = booking.status === "confirmed";

    booking.status = "cancelled";
    await booking.save();

    // Only restore the seat if it was actually confirmed and deducted
    if (wasConfirmed) {
      await Event.findByIdAndUpdate(booking.eventId, {
        $inc: { availableSeats: 1 },
      });
    }

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    next(error);
  }
};
