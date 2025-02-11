const express = require("express");
const planRouter = require("./Router/planRouter");
const userRouter = require("./Router/userRouter");
const viewRouter = require("./Router/viewRouter");
const bookingRouter = require("./Router/bookingRouter");
const reviewRouter = require("./Router/reviewRouter");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");

// it tracks incoming request and see if there is data in the request => the data will be fed in req.body
app.use(express.json());
app.use(cookieParser());

app.use(express.static(__dirname + "/public"));

// view engine set
app.set("view engine", "pug");

// view path set
app.set("views", path.join(__dirname, "View"));

app.use("/api/booking", bookingRouter);
app.use("/api/plans", planRouter);
app.use("/api/user", userRouter);
app.use("/api/review", reviewRouter);
app.use("", viewRouter);

let port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("server started at port 3000");
});
