const bcrypt = require("bcryptjs");
const User = require("../models/User");
const LoginLog = require("../models/LoginLog");

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    if (role === "candidate") {
      const Candidate = require("../models/Candidate");

      await Candidate.create({
        userId: user._id,
        name,
        mobile: "",
        experience: 0,
        personalityScore: 0,
        skills: []
      });
    }

    res.redirect("/");

  } catch (err) {
    res.send("Register Error");
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", {
        title: "Login",
        error: "Invalid Email or Password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Invalid Email or Password"
      });
    }

    req.session.user = {
      id: user._id,
      role: user.role,
      email: user.email
    };

    await LoginLog.create({
    userId: user._id,
    role: user.role,
    email: user.email,
    ipAddress: req.ip
  });

    req.session.save(() => {
      if (user.role === "hr") {
        return res.redirect("/hr/dashboard");
      } else if (user.role === "candidate") {
        return res.redirect("/candidate/dashboard");
      } else {
        return res.redirect("/");
      }
    });

  } catch (error) {
    res.render("login", {
      title: "Login",
      error: "Something went wrong"
    });
  }
};