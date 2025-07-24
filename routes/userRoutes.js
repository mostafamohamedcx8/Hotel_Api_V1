const express = require("express");
const authService = require("../services/authService");

const {
  getLoggedUserData,
  getUser,
  storeRecentSearchedCities,
} = require("../services/userService");
const router = express.Router();

router.use(authService.protect);
router.get("/getMe", getLoggedUserData, getUser);
router.post("/recent-search", storeRecentSearchedCities);

module.exports = router;
