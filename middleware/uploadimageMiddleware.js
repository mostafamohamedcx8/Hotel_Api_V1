const multer = require("multer");
const ApiError = require("../utils/apiError");

const multerOption = () => {
  const multerstorage = multer.memoryStorage();
  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new ApiError("Not an image! Please upload only images.", 400), false);
    }
  };
  const upload = multer({ storage: multerstorage, fileFilter: multerFilter });
  return upload;
};

exports.uploadSingleImage = (fieldName) => multerOption().single(fieldName);

exports.uploadMixOfImages = (arrayOfFields) =>
  multerOption().fields(arrayOfFields);
