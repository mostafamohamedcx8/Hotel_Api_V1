const express = require("express");
const {
  createRoom,
  uploadRoomImages,
  resizeRoomImages,
  getAllRooms,
  getRoomsByHotel,
  toggleRoomAvailability,
  getSpecificRoom,
} = require("../services/roomService");

const { createRoomValidator } = require("../utils/validation/roomValidation");
const authService = require("../services/authService");

const router = express.Router();
router.get("/", getAllRooms);

router.use(authService.protect);
router.post(
  "/",
  uploadRoomImages,
  resizeRoomImages,
  createRoomValidator,
  createRoom
);
router.get("/:id", authService.allowedTo("hotelOwner"), getRoomsByHotel);
router.put("/:id", toggleRoomAvailability);
router.get("/specific/:id", getSpecificRoom);

module.exports = router;
