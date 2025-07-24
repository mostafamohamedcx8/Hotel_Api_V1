const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    hotel: { type: String, ref: "Hotel", required: true },
    roomType: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    animties: { type: Array, required: true },
    images: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RoomSchema.method("toJSON", function () {
  const room = this.toObject();
  if (room.images && Array.isArray(room.images)) {
    room.images = room.images.map((image) => {
      if (image.startsWith("http")) return image;
      return `${process.env.BASE_URL}/rooms/${image}`;
    });
  }
  return room;
});

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
