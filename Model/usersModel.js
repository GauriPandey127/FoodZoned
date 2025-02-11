const mongoose = require("mongoose");
const crypto = require("crypto");
// const {DB_LINK} = require("../config/secrets");

const DB_LINK = process.env.DB_LINK;

mongoose
  .connect(DB_LINK, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((db) => {
    console.log("Connected to db !!!");
  });

let userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: Number,
  },
  address: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    minlength: [6, "Password must be greater than 6 characters"],
    required: true,
  },
  confirmPassword: {
    type: String,
    minlength: [6, "Password must be greater than 6 characters"],
    validate: {
      validator: function () {
        return this.password == this.confirmPassword;
      },
      message: "Password didn't matched !!",
    },
  },
  role: {
    type: String,
    enum: ["admin", "user", "restaurant owner", "delivery boy"],
    default: "user",
  },
  pImage: {
    type: String,
    default: "/images/users/default.png",
  },
  pwToken: String,
  tokenTime: String,
  bookedPlanId: {
    type: String,
  },
});

// it will run before create is called on userModel
userSchema.pre("save", function () {
  this.confirmPassword = undefined;
});

// forget password pe click kia ho to ispe call

userSchema.methods.createResetToken = function () {
  // token bnado
  let token = crypto.randomBytes(32).toString("hex");
  let time = Date.now() * 60 * 10 * 1000;

  // token time banado
  this.pwToken = token;
  this.tokenTime = time;
  return token;
  // and set in current document
  // save()
};

userSchema.methods.resetPasswordHandler = function (password, confirmPassword) {
  this.password = password;
  this.confirmPassword = confirmPassword;
  this.pwToken = undefined;
  this.tokenTime = undefined;
};

const userModel = mongoose.model("userscollection", userSchema);
module.exports = userModel;
