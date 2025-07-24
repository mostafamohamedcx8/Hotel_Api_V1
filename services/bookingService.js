const Booking = require("../models/BookingModel");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Room = require("../models/RoomModel");
const stripe = require("stripe")(process.env.STRIP_SECRET);

const calculateNights = (checkInDate, checkOutDate) => {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const timeDiff = checkOut - checkIn;
  const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return nights;
};

const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  const bookings = await Booking.find({
    room,
    checkInDate: { $lte: checkOutDate },
    checkOutDate: { $gte: checkInDate },
  });

  const isAvailable = bookings.length === 0;
  return isAvailable;
};

// ✅ 2. API - POST /api/bookings/check-availability
exports.checkAvailabilityAPI = asyncHandler(async (req, res, next) => {
  const { room, checkInDate, checkOutDate } = req.body;

  if (!room || !checkInDate || !checkOutDate) {
    return next(
      new ApiError("Room, check-in date, and check-out date are required", 400)
    );
  }

  const isAvailable = await checkAvailability({
    checkInDate,
    checkOutDate,
    room,
  });

  res.status(200).json({
    success: true,
    isAvailable,
  });
});

exports.createBooking = asyncHandler(async (req, res, next) => {
  const { room, hotel, checkInDate, checkOutDate, guests, paymentMethod } =
    req.body;

  const existingRoom = await Room.findById(room);
  if (!existingRoom) {
    return next(new ApiError("Room not found", 404));
  }

  const isAvailable = await checkAvailability({
    checkInDate,
    checkOutDate,
    room,
  });
  if (!isAvailable) {
    return next(
      new ApiError("Room is not available for the selected dates", 400)
    );
  }

  const nights = calculateNights(checkInDate, checkOutDate);
  if (nights <= 0) {
    return next(
      new ApiError("Check-out date must be after check-in date", 400)
    );
  }

  const totalPrice = nights * existingRoom.pricePerNight;

  const booking = await Booking.create({
    user: req.user._id,
    room,
    hotel,
    checkInDate,
    checkOutDate,
    totalPrice,
    guests,
    paymentMethod,
  });

  res.status(201).json({
    message: "Booking created successfully",
    data: booking,
  });
});

exports.getUserBookings = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const bookings = await Booking.find({ user: userId })
    .populate("room", "roomType pricePerNight images")
    .populate("hotel", "name address city");

  if (!bookings || bookings.length === 0) {
    return next(new ApiError("No bookings found for this user", 404));
  }

  res.status(200).json({
    results: bookings.length,
    data: bookings,
  });
});

exports.getBookingsByHotel = asyncHandler(async (req, res, next) => {
  const { hotelId } = req.params;

  if (!hotelId) {
    return next(new ApiError("Hotel ID is required", 400));
  }

  const bookings = await Booking.find({ hotel: hotelId })
    .populate("user", "username email")
    .populate("room", "roomType pricePerNight");

  const totalBookings = bookings.length;

  const totalRevenue = bookings.reduce((acc, booking) => {
    return acc + booking.totalPrice;
  }, 0);

  res.status(200).json({
    success: true,
    totalBookings,
    totalRevenue,
    data: bookings,
  });
});

exports.updateBookingToPaid = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(
      new ApiError(`No booking found with ID: ${req.params.id}`, 404)
    );
  }

  booking.ispaid = true;
  booking.paidAt = Date.now();

  const updatedBooking = await booking.save();

  res.status(200).json({
    success: true,
    data: updatedBooking,
  });
});

exports.CheckoutSession = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(
      new ApiError(`No booking found with ID: ${req.params.id}`, 404)
    );
  }

  const bookingPrice = booking.totalPrice;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: req.user.username,
          },
          unit_amount: bookingPrice * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `https://hotel-booking-app-nine-lyart.vercel.app/mybooking`,
    cancel_url: `https://hotel-booking-app-nine-lyart.vercel.app/mybooking`,
    customer_email: req.user.email,
    client_reference_id: req.params.id,
  });
  res.status(200).json({ status: "success", session });
});

const createCardOrder = async (session) => {
  const bookingId = session.client_reference_id;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    console.log(`Booking not found for ID ${bookingId}`);
    return;
  }

  booking.ispaid = true;
  booking.paymentMethod = "Card";
  booking.status = "confirmed";
  booking.paymentAt = new Date();

  await booking.save();
};

exports.WebhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    createCardOrder(event.data.object);
  }
  res.status(200).json({ received: true });
});
