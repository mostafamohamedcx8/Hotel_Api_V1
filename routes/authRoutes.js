const express = require("express");

const { signup, login } = require("../services/authService");
const {
  signupvalidation,
  loginvalidation,
} = require("../utils/validation/authValidation");

const router = express.Router();

router.post("/signup", signupvalidation, signup);
router.post("/login", loginvalidation, login);

module.exports = router;
