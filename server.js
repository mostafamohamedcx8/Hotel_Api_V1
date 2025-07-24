const cors = require("cors");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const dbconnection = require("./config/database");
dotenv.config({ path: ".env" });
const compression = require("compression");
const GlobalError = require("./middleware/errorMiddleware");
const authroute = require("./routes/authRoutes");
const userroute = require("./routes/userRoutes");
const hotelroute = require("./routes/hotelRoutes");
const roomroute = require("./routes/roomRoutes");
const bookingroute = require("./routes/bookingRoutes");
const { WebhookCheckout } = require("./services/bookingService");

// connection with db
dbconnection();
const app = express();
// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "uploads")));
app.use(cors());

app.use(compression());

app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  WebhookCheckout
);

if (process.env.NODE_ENV == "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

app.use("/api/v1/auth", authroute);
app.use("/api/v1/user", userroute);
app.use("/api/v1/hotel", hotelroute);
app.use("/api/v1/room", roomroute);
app.use("/api/v1/booking", bookingroute);

app.use(GlobalError);
app.get("/", (req, res) => res.send("Api is Working"));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));

// Handel rejection error outside exprees
process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection Error: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});
