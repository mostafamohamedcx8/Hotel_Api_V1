const express = require("express");
const {
  checkAvailabilityAPI,
  createBooking,
  getUserBookings,
  getBookingsByHotel,
  updateBookingToPaid,
  CheckoutSession,
} = require("../services/bookingService");

const authService = require("../services/authService");

const router = express.Router();

router.use(authService.protect);
router.post("/", checkAvailabilityAPI);
router.post("/bookroom", createBooking);
router.get("/mybooking", getUserBookings);
router.get(
  "/hotel/:hotelId",
  authService.allowedTo("hotelOwner"),
  getBookingsByHotel
);
router.get("/check_out_session/:id", CheckoutSession);
router.put(
  "/pay/:id",
  authService.allowedTo("hotelOwner"),
  updateBookingToPaid
);

module.exports = router;
