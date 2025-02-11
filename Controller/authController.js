const userModel = require("../Model/usersModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// const { SECRET_KEY, GMAIL_ID, GMAIL_PW } = require("../config/secrets");

const SECRET_KEY = process.env.SECRET_KEY;
const GMAIL_ID = process.env.GMAIL_ID;
const GMAIL_PW = process.env.GMAIL_PW;

async function sendEmail(message) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: GMAIL_ID,
        pass: GMAIL_PW,
      },
    });

    let res = await transporter.sendMail({
      from: message.from, // sender address
      to: message.to, // list of receivers
      subject: message.subject, // Subject line
      text: message.text, // plain text body
    });
    return res;
  } catch (error) {
    return error;
  }
}

async function signup(req, res) {
  try {
    let user = req.body;
    let newUser = await userModel.create({
      name: user.name,
      email: user.email,
      password: user.password,
      confirmPassword: user.confirmPassword,
      role: user.role,
    });
    console.log(newUser);
    res.status(201).json({
      message: "Succesfully Signed up !!",
      data: newUser,
    });
  } catch (error) {
    res.status(501).json({
      message: "Failed to sign up !!",
      error,
    });
  }
}
async function login(req, res) {
  try {
    let { email, password } = req.body;
    console.log(email, password);
    let loggedInUser = await userModel.find({ email: email });
    if (loggedInUser.length) {
      let user = loggedInUser[0];
      if (user.password == password) {
        // token ban na chahie
        const token = jwt.sign({ id: user["_id"] }, SECRET_KEY);

        res.cookie("jwt", token, { httpOnly: true });
        res.status(200).json({
          message: "Logged in succesfully !!",
          data: loggedInUser[0],
        });
        // res.redirect("/");
      } else {
        // res.render("login.pug" , {message:"Email and Password didn't Matched !!"});
        res.status(200).json({
          message: "Email and Password didn't Matched !!",
        });
      }
    } else {
      res.status(200).json({
        message: "No User Found SignUp First",
      });
      // res.render("login.pug" , {message:"No User Found SignUp First"});
    }
  } catch (error) {
    res.status(200).json({
      message: "Login Failed !!",
      error,
    });
    // res.render("login.pug" , {message:error});
  }
}

async function logout(req, res) {
  try {
    res.clearCookie("jwt");
    res.redirect("/");
  } catch (error) {
    res.status(501).json({
      error,
    });
  }
}

async function isLoggedIn(req, res, next) {
  try {
    let token = req.cookies.jwt;
    const payload = jwt.verify(token, SECRET_KEY);
    if (payload) {
      // logged in hai
      let user = await userModel.findById(payload.id);
      req.name = user.name;
      req.user = user;
      next();
    } else {
      //logged in nhi hai
      next();
    }
  } catch (error) {
    next();
  }
}

async function protectRoute(req, res, next) {
  try {
    // const token = req.headers.authorization.split(" ").pop();
    // console.log(token);
    const token = req.cookies.jwt;
    console.log("Inside protectRoute function");
    const payload = jwt.verify(token, SECRET_KEY);
    console.log(payload);
    if (payload) {
      req.id = payload.id;
      next();
    } else {
      res.status(501).json({
        message: "Please Log in !!",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Please Log in !!",
      error,
    });
  }
}

async function isAuthorized(req, res, next) {
  try {
    let id = req.id;
    let user = await userModel.findById(id);
    console.log(user);
    if (user.role == "admin") {
      next();
    } else {
      res.status(200).json({
        message: "You dont have admin rights !!!",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Failed to Authorize",
      error,
    });
  }
}

async function forgetPassword(req, res) {
  try {
    let { email } = req.body;
    console.log(email);
    let user = await userModel.findOne({ email: email });
    console.log(user);
    if (user) {
      // pwToken
      // timeset
      let token = user.createResetToken();
      console.log(token);
      await user.save({ validateBeforeSave: false });
      // console.log(updatedUser);
      let resetLink = `https://foodzoned--app.herokuapp.com/resetpassword/${token}`;
      let message = {
        from: "mayankaggarwal267@gmail.com",
        to: email,
        subject: "Reset Password",
        text: resetLink,
      };
      let response = await sendEmail(message);
      res.json({
        message: "Reset Link is sent to email",
        response,
      });
    } else {
      res.status(404).json({
        message: "User Not Found ! Please Sign up first !",
      });
    }
  } catch (error) {
    res.status(200).json({
      message: "Failed to forget Password",
      error,
    });
  }
}

async function resetPassword(req, res) {
  try {
    const token = req.params.token;
    const { password, confirmPassword } = req.body;
    const user = await userModel.findOne({
      pwToken: token,
      tokenTime: { $gt: Date.now() },
    });
    console.log(user);
    console.log(password, confirmPassword);
    if (user) {
      user.resetPasswordHandler(password, confirmPassword);
      await user.save();
      res.status(200).json({
        message: "Password Reset Succesfull.",
      });
    } else {
      res.status(200).json({
        message: "Password Reset Link Expired !!!",
      });
    }
  } catch (error) {
    res.status(404).json({
      message: "Failed to reset password",
      error,
    });
  }
}

async function contactUs(req, res) {
  try {
    let messageBody = req.body;
    let textBody = `Name: ${messageBody.name}
    Email: ${messageBody.email}
    Source: ${messageBody.source}
    Feedback: ${messageBody.feedback}
    CheckBox: ${messageBody.checkbox}`;

    let message = {
      from: "rohitrt4783@gmail.com", //from: foodZoned App
      to: "mayankaggarwal267@gmail.com", //to: admin
      subject: "FoodApp Contact Us Email",
      text: textBody,
    };
    console.log(message);
    let response = sendEmail(message);
    res.json({
      message: "Contact Details Sent",
      response,
    });
  } catch (error) {
    res.status(200).json({
      message: "Failed to sent contact details",
      error,
    });
  }
}

module.exports.signup = signup;
module.exports.login = login;
module.exports.logout = logout;
module.exports.protectRoute = protectRoute;
module.exports.isAuthorized = isAuthorized;
module.exports.forgetPassword = forgetPassword;
module.exports.resetPassword = resetPassword;
module.exports.isLoggedIn = isLoggedIn;
module.exports.contactUs = contactUs;
