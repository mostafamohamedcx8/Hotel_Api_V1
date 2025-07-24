const { check } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const Hotel = require("../../models/HotelModel");

exports.createRoomValidator = [
  check("hotel")
    .notEmpty()
    .withMessage("hotel ID is required")
    .isMongoId()
    .withMessage("Invalid hotel ID format")
    .custom(async (val, { req }) => {
      const hotel = await Hotel.findById(val);
      if (!hotel) {
        throw new Error("No hotel found with this ID");
      }

      if (hotel.owner !== req.user._id.toString()) {
        throw new Error("You are not authorized to add a room to this hotel");
      }

      return true;
    }),

  check("roomType")
    .notEmpty()
    .withMessage("Room type is required")
    .isString()
    .withMessage("Room type must be a string"),

  check("pricePerNight")
    .notEmpty()
    .withMessage("Price per night is required")
    .isNumeric()
    .withMessage("Price must be a number"),

  check("animties")
    .isArray({ min: 1 })
    .withMessage("Amenities must be a non-empty array"),

  validatorMiddleware,
];
