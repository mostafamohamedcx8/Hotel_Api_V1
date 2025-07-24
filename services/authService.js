const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/UserModel");
const ApiError = require("../utils/apiError");
const createToken = require("../utils/createtoken");

// @desc    Signup
// @route   GET /api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
  // 1-Create User
  const user = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  });
  // 2- create token
  const token = createToken(user._id);
  // 3- Send response
  res.status(201).json({
    data: user,
    token,
  });
});

// @desc    Login
// @route   GET /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  // 1- Find User
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Invalid email or password", 401));
  }
  // 3- create token
  const token = createToken(user._id);
  // 4- Send response
  res.status(201).json({
    data: user,
    token,
  });
});

// make sure that user is loggin
exports.protect = asyncHandler(async (req, res, next) => {
  // 1- check if token exist and if exist get
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(new ApiError("You are not logged in", 401));
  }
  //2- verify token (no change happen, expired token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  // 3- check if user still exist
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(new ApiError("User no longer exist", 401));
  }
  // 4- check if user changed his password after token created
  if (currentUser.passwordchangedAt) {
    const passchangedTimeStamp = parseInt(
      currentUser.passwordchangedAt.getTime / 1000,
      10
    );
    if (passchangedTimeStamp > decoded.iat) {
      return next(
        new ApiError("User recently changed password, PLZ login Again", 401)
      );
    }
  }
  req.user = currentUser;
  next();
});

// Authorization {User Permission}
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not authorized to perform this action", 403)
      );
    }
    next();
  });
