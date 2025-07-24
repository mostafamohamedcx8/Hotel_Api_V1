const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const ApiError = require("../utils/apiError");

// @desc    Get Logged user data
// @route   GET /api/v1/users/getMe
// @access  Private/Protect
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new ApiError(`No user found for ID: ${id}`, 404));
  }
  res.status(200).json({ data: user });
});

// @desc    Store recent searched city for user
// @route   POST /api/v1/users/recent-search
// @access  Private
exports.storeRecentSearchedCities = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { city } = req.body;

  if (!city || typeof city !== "string") {
    return next(
      new ApiError("City name is required and must be a string", 400)
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(`No user found for ID: ${userId}`, 404));
  }

  // Remove city if it already exists (case-insensitive)
  user.recentSearchedCities = user.recentSearchedCities.filter(
    (c) => c.toLowerCase() !== city.toLowerCase()
  );

  // Add to beginning
  user.recentSearchedCities.unshift(city);

  // Keep only last 5
  if (user.recentSearchedCities.length > 3) {
    user.recentSearchedCities = user.recentSearchedCities.slice(0, 3);
  }

  await user.save();

  res.status(200).json({
    message: "Recent searched city updated successfully",
    recentSearchedCities: user.recentSearchedCities,
  });
});
