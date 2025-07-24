const asyncHandler = require("express-async-handler");
const Hotel = require("../models/HotelModel");
const User = require("../models/UserModel");
const ApiError = require("../utils/apiError");

// @desc    Register a new hotel
// @route   POST /api/v1/hotels
// @access  Private/Hotel Owner only
exports.registerHotel = asyncHandler(async (req, res, next) => {
  const { name, address, contact, city } = req.body;
  const ownerId = req.user._id;

  const user = await User.findById(ownerId);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  // Check for duplicate hotel by same owner in same city
  const existingHotel = await Hotel.findOne({
    name: name.trim(),
    city: city.trim(),
    owner: ownerId.toString(),
  });

  if (existingHotel) {
    return next(
      new ApiError(
        "You already registered a hotel with this name in this city",
        409
      )
    );
  }

  // Create new hotel
  const hotel = await Hotel.create({
    name,
    address,
    contact,
    city,
    owner: ownerId,
  });

  // Update user role to hotelOwner if not already
  if (user.role !== "hotelOwner") {
    user.role = "hotelOwner";
    await user.save();
  }

  res.status(201).json({
    message: "Hotel registered successfully",
    data: hotel,
  });
});

exports.getMyHotels = asyncHandler(async (req, res, next) => {
  const ownerId = req.user._id;

  const user = await User.findById(ownerId);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  if (user.role !== "hotelOwner") {
    return next(new ApiError("Only hotel owners can view their hotels", 403));
  }

  const hotels = await Hotel.find({ owner: ownerId });

  res.status(200).json({
    message: "Hotels fetched successfully",
    total: hotels.length,
    data: hotels,
  });
});
