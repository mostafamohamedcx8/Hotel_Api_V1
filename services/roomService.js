const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { uploadMixOfImages } = require("../middleware/uploadimageMiddleware");
const Room = require("../models/RoomModel");
const Hotel = require("../models/HotelModel");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");
const cloudinary = require("../config/cloudinary");

exports.uploadRoomImages = uploadMixOfImages([
  {
    name: "images",
    maxCount: 10, // أو أي عدد تحب تسمح به
  },
]);

exports.resizeRoomImages = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.images) {
    console.log("No files found in request.");
    return next(new ApiError("Room images are required", 400));
  }

  req.body.images = [];

  await Promise.all(
    req.files.images.map((img) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "rooms",
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(error);
            }
            req.body.images.push(result.secure_url);
            resolve();
          }
        );

        stream.end(img.buffer);
      });
    })
  );

  next();
});

exports.createRoom = asyncHandler(async (req, res, next) => {
  const { hotel, roomType, pricePerNight, animties } = req.body;

  // ✅ 1. تأكد الفندق موجود
  const existingHotel = await Hotel.findById(hotel);
  if (!existingHotel) {
    return next(new ApiError("Hotel not found", 404));
  }

  // ✅ 2. تأكد إن اليوزر الحالي هو صاحب الفندق
  if (existingHotel.owner.toString() !== req.user._id.toString()) {
    return next(
      new ApiError("You are not authorized to add rooms to this hotel", 403)
    );
  }

  // ✅ 3. تأكد من وجود الصور
  const images = req.body.images || [];

  // ✅ 4. إنشاء الغرفة
  const room = await Room.create({
    hotel,
    roomType,
    pricePerNight,
    animties,
    images,
  });

  res.status(201).json({ message: "Room created successfully", data: room });
});

exports.getAllRooms = asyncHandler(async (req, res, next) => {
  let filter = { isAvailable: true };

  // ✅ دعم roomType من query
  if (req.query.roomType) {
    const types = req.query.roomType.split(",");
    filter.roomType = { $in: types };
  }

  // ✅ دعم السعر
  if (req.query["price[gte]"]) {
    filter.pricePerNight = {
      ...filter.pricePerNight,
      $gte: req.query["price[gte]"],
    };
  }
  if (req.query["price[lte]"]) {
    filter.pricePerNight = {
      ...filter.pricePerNight,
      $lte: req.query["price[lte]"],
    };
  }

  const countDocuments = await Room.countDocuments(filter);

  const apiFeatures = new ApiFeatures(
    Room.find(filter).populate({
      path: "hotel",
      populate: {
        path: "owner",
        select: "image",
      },
    }),
    req.query
  )
    .sort()
    .paginate(countDocuments)
    .Limitfields();

  const { paginationresults, mongooseQuery } = apiFeatures;
  const rooms = await mongooseQuery;

  if (!rooms || rooms.length === 0) {
    return next(new ApiError("No available rooms found", 404));
  }

  res.status(200).json({
    message: "Available rooms fetched successfully",
    results: rooms.length,
    paginationresults,
    data: rooms,
  });
});

exports.getRoomsByHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // ✅ 1. تأكد إن الفندق موجود
  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return next(new ApiError("Hotel not found", 404));
  }

  // ✅ 2. جلب كل الغرف المرتبطة بالفندق
  const rooms = await Room.find({ hotel: id }).populate({
    path: "hotel",
    populate: {
      path: "owner",
      select: "image",
    },
  });

  // ✅ 3. الرد
  res.status(200).json({
    message: "Rooms for this hotel fetched successfully",
    results: rooms.length,
    data: rooms,
  });
});

exports.toggleRoomAvailability = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // ✅ 1. ابحث عن الغرفة مع الفندق والمالك
  const room = await Room.findById(id).populate({
    path: "hotel",
    select: "owner",
  });

  if (!room) {
    return next(new ApiError("Room not found", 404));
  }

  // ✅ 2. تأكد إن المستخدم الحالي هو صاحب الفندق
  if (room.hotel.owner.toString() !== req.user._id.toString()) {
    return next(
      new ApiError("You are not authorized to modify this room", 403)
    );
  }

  // ✅ 3. عكس حالة التوفر
  room.isAvailable = !room.isAvailable;

  // ✅ 4. حفظ التحديث
  await room.save();

  res.status(200).json({
    message: `Room availability toggled to ${room.isAvailable}`,
    data: room,
  });
});

exports.getSpecificRoom = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const room = await Room.findById(id).populate({
    path: "hotel",
    populate: {
      path: "owner",
      select: "image name", // حسب اللي محتاجه
    },
  });

  if (!room) {
    return next(new ApiError("Room not found", 404));
  }

  res.status(200).json({
    message: "Room fetched successfully",
    data: room,
  });
});
