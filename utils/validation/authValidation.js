const { check } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const User = require("../../models/UserModel");

exports.signupvalidation = [
  check("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .custom(async (val) => {
      const user = await User.findOne({ email: val });
      if (user) {
        throw new Error("Email already in use");
      }
      return true;
    }),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  check("role")
    .optional()
    .isIn(["user", "hotelOwner"])
    .withMessage("Invalid role"),
  check("recentSearchedCities")
    .optional()
    .isArray()
    .withMessage("recentSearchedCities must be an array of strings"),
  validatorMiddleware,
];

exports.loginvalidation = [
  check("email")
    .notEmpty()
    .withMessage("email required")
    .isEmail()
    .withMessage("invalid email address"),
  check("password")
    .notEmpty()
    .withMessage("password required")
    .isLength({ minn: 6 })
    .withMessage("password must be at least 6 characters"),

  validatorMiddleware,
];
