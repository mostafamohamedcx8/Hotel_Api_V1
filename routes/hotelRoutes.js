const express = require("express");
const { registerHotel, getMyHotels } = require("../services/hotelService");
const {
  createHotelValidation,
} = require("../utils/validation/hotelValidation");
const authService = require("../services/authService");

const router = express.Router();

router.use(authService.protect);
router.post("/", createHotelValidation, registerHotel);
router.get("/", authService.allowedTo("hotelOwner"), getMyHotels);

module.exports = router;
