const { check } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");

exports.createHotelValidation = [
  check("name")
    .notEmpty()
    .withMessage("Hotel name is required")
    .isLength({ min: 3 })
    .withMessage("Hotel name must be at least 3 characters"),

  check("address").notEmpty().withMessage("Address is required"),

  check("contact")
    .notEmpty()
    .withMessage("Contact is required")
    .isMobilePhone()
    .withMessage("Invalid contact number"),

  check("city").notEmpty().withMessage("City is required"),

  validatorMiddleware,
];
